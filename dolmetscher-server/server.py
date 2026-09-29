# -*- coding: utf-8 -*-
"""
Standard Plus - Dolmetscher-Server
==================================

Nimmt Ton entgegen, erkennt die Sprache, uebersetzt sie und schickt
das Ergebnis zurueck - auf Wunsch auch als gesprochene Fassung.

Der springende Punkt: alle drei Modelle laufen auf DIESEM Server.
Es wird zu keinem Zeitpunkt ein fremder Dienst aufgerufen. Damit
bleibt die Zusage auf der Website ("keine Drittanbieter, Verarbeitung
in der EU") woertlich richtig - vorausgesetzt, dieser Server steht
in der EU.

Betriebsart "Ohrhoerer" (Raum mit zwei Seiten):

    Person A spricht Deutsch
      -> Sprechpause erkennen   (WebRTC-VAD)
      -> mitschreiben           (Whisper, Deutsch)
      -> uebersetzen            (NLLB, in die Sprache von Person B)
      -> vorlesen               (Piper, rumaenische Stimme)
      -> die Stimme geht an PERSON B, nicht an Person A

    Und in der Gegenrichtung genauso. Jede Seite hoert die andere
    in der eigenen Sprache - wie bei einem Dolmetscher im Ohr.

    Die Zielsprache ergibt sich aus dem, was die Gegenseite beim
    Betreten des Raums angegeben hat. Niemand stellt sie ein.

Nichts wird auf die Festplatte geschrieben. Der Ton lebt nur im
Arbeitsspeicher und wird nach jedem Satz verworfen.
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
import webrtcvad
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

# --------------------------------------------------------------------------
# Einstellungen (alle ueber Umgebungsvariablen aenderbar)
# --------------------------------------------------------------------------

ABTASTRATE = 16000              # Hz - muss zum Browser passen
RAHMEN_MS = 20                  # Laenge eines VAD-Rahmens
RAHMEN_BYTES = ABTASTRATE * 2 * RAHMEN_MS // 1000

WHISPER_MODELL = os.getenv("SP_WHISPER", "large-v3")
WHISPER_GERAET = os.getenv("SP_GERAET", "cuda")        # "cuda" oder "cpu"
WHISPER_TYP = os.getenv("SP_RECHENTYP", "float16")     # auf CPU: "int8"

UEBERSETZER_MODELL = os.getenv("SP_UEBERSETZER", "facebook/nllb-200-distilled-600M")

PIPER = os.getenv("SP_PIPER", "piper")                 # Pfad zur Piper-Programmdatei
STIMMEN_ORDNER = Path(os.getenv("SP_STIMMEN", "/modelle/stimmen"))

STILLE_MS = int(os.getenv("SP_STILLE_MS", "900"))      # Pause, die einen Satz beendet
MAX_SATZ_MS = int(os.getenv("SP_MAX_SATZ_MS", "15000"))  # Notbremse bei Dauerredner
VORLAUF_MS = 300                # so viel Ton vor dem ersten Laut mitnehmen

# Sprachkuerzel: Browser -> Whisper -> NLLB -> Piper-Stimme
SPRACHEN = {
    "de": {"whisper": "de", "nllb": "deu_Latn", "stimme": "de_DE-thorsten-medium"},
    "ro": {"whisper": "ro", "nllb": "ron_Latn", "stimme": "ro_RO-mihai-medium"},
    "en": {"whisper": "en", "nllb": "eng_Latn", "stimme": "en_US-lessac-medium"},
    "pl": {"whisper": "pl", "nllb": "pol_Latn", "stimme": "pl_PL-darkman-medium"},
    "bg": {"whisper": "bg", "nllb": "bul_Cyrl", "stimme": None},
    "hu": {"whisper": "hu", "nllb": "hun_Latn", "stimme": "hu_HU-anna-medium"},
    "hr": {"whisper": "hr", "nllb": "hrv_Latn", "stimme": None},
    "sk": {"whisper": "sk", "nllb": "slk_Latn", "stimme": "sk_SK-lili-medium"},
    "cs": {"whisper": "cs", "nllb": "ces_Latn", "stimme": "cs_CZ-jirka-medium"},
    "it": {"whisper": "it", "nllb": "ita_Latn", "stimme": "it_IT-riccardo-x_low"},
    "es": {"whisper": "es", "nllb": "spa_Latn", "stimme": "es_ES-davefx-medium"},
    "pt": {"whisper": "pt", "nllb": "por_Latn", "stimme": "pt_PT-tugao-medium"},
    "tr": {"whisper": "tr", "nllb": "tur_Latn", "stimme": "tr_TR-fahrettin-medium"},
    "uk": {"whisper": "uk", "nllb": "ukr_Cyrl", "stimme": "uk_UA-ukrainian_tts-medium"},
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-7s %(message)s")
log = logging.getLogger("dolmetscher")

app = FastAPI(title="Standard Plus Dolmetscher")

# Wird beim Start einmal geladen und danach von allen Gespraechen geteilt
MODELLE = {}


# --------------------------------------------------------------------------
# Modelle laden
# --------------------------------------------------------------------------

@app.on_event("startup")
def modelle_laden():
    """Alles einmal beim Start laden. Beim ersten Gespraech soll niemand warten."""
    from faster_whisper import WhisperModel
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    log.info("Whisper wird geladen: %s auf %s (%s)",
             WHISPER_MODELL, WHISPER_GERAET, WHISPER_TYP)
    MODELLE["whisper"] = WhisperModel(
        WHISPER_MODELL, device=WHISPER_GERAET, compute_type=WHISPER_TYP
    )

    log.info("Uebersetzungsmodell wird geladen: %s", UEBERSETZER_MODELL)
    MODELLE["tokenizer"] = AutoTokenizer.from_pretrained(UEBERSETZER_MODELL)
    modell = AutoModelForSeq2SeqLM.from_pretrained(UEBERSETZER_MODELL)
    if WHISPER_GERAET == "cuda":
        modell = modell.to("cuda").half()
    modell.eval()
    MODELLE["uebersetzer"] = modell

    MODELLE["vad"] = webrtcvad.Vad(2)   # 0 = nachsichtig, 3 = streng
    log.info("Bereit.")


@app.get("/gesundheit")
def gesundheit():
    """Fuer die Ueberwachung: laeuft alles?"""
    return JSONResponse({
        "bereit": bool(MODELLE.get("whisper") and MODELLE.get("uebersetzer")),
        "whisper": WHISPER_MODELL,
        "uebersetzer": UEBERSETZER_MODELL,
        "geraet": WHISPER_GERAET,
        "sprachen": sorted(SPRACHEN.keys()),
    })


# --------------------------------------------------------------------------
# Einzelschritte
# --------------------------------------------------------------------------

def mitschreiben(ton: np.ndarray, sprache: str):
    """Whisper: gesprochener Ton -> Text. Gibt Text und Zuversicht zurueck."""
    segmente, info = MODELLE["whisper"].transcribe(
        ton,
        language=SPRACHEN[sprache]["whisper"],
        beam_size=5,
        vad_filter=False,          # die Rahmenerkennung hat das schon erledigt
        condition_on_previous_text=False,
        no_speech_threshold=0.5,
    )
    teile, wahrscheinlichkeiten = [], []
    for s in segmente:
        teile.append(s.text.strip())
        wahrscheinlichkeiten.append(getattr(s, "avg_logprob", -1.0))

    text = " ".join(t for t in teile if t).strip()
    if not wahrscheinlichkeiten:
        return text, 0.0
    # Aus dem Mittel der Logarithmen einen Wert zwischen 0 und 1 machen
    mittel = sum(wahrscheinlichkeiten) / len(wahrscheinlichkeiten)
    zuversicht = max(0.0, min(1.0, float(np.exp(mittel))))
    return text, zuversicht


def uebersetzen(text: str, von: str, nach: str) -> str:
    """NLLB: Text von einer Sprache in die andere."""
    if not text:
        return ""
    import torch

    tok = MODELLE["tokenizer"]
    tok.src_lang = SPRACHEN[von]["nllb"]
    eingabe = tok(text, return_tensors="pt", truncation=True, max_length=384)
    if WHISPER_GERAET == "cuda":
        eingabe = {k: v.to("cuda") for k, v in eingabe.items()}

    ziel_id = tok.convert_tokens_to_ids(SPRACHEN[nach]["nllb"])
    with torch.no_grad():
        ausgabe = MODELLE["uebersetzer"].generate(
            **eingabe,
            forced_bos_token_id=ziel_id,
            max_new_tokens=384,
            num_beams=4,
        )
    return tok.batch_decode(ausgabe, skip_special_tokens=True)[0].strip()


def vorlesen(text: str, sprache: str):
    """Piper: Text -> WAV. Gibt None zurueck, wenn keine Stimme vorhanden ist."""
    stimme = SPRACHEN[sprache].get("stimme")
    if not stimme or not text:
        return None
    datei = STIMMEN_ORDNER / (stimme + ".onnx")
    if not datei.exists():
        log.warning("Stimme fehlt: %s", datei)
        return None

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as ziel:
        try:
            subprocess.run(
                [PIPER, "--model", str(datei), "--output_file", ziel.name],
                input=text.encode("utf-8"),
                check=True, capture_output=True, timeout=20,
            )
            return Path(ziel.name).read_bytes()
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as f:
            log.warning("Sprachausgabe fehlgeschlagen: %s", f)
            return None


# --------------------------------------------------------------------------
# Raeume: zwei Seiten, die sich gegenseitig hoeren
# --------------------------------------------------------------------------

class Teilnehmer:
    """Eine sprechende Seite im Raum."""

    def __init__(self, dose, sprache: str, name: str, mit_stimme: bool, stille_ms: int):
        self.dose = dose
        self.sprache = sprache
        self.name = name
        self.mit_stimme = mit_stimme
        self.stille_rahmen_noetig = max(1, stille_ms // RAHMEN_MS)

        self.rest = b""
        self.vorlauf = deque(maxlen=VORLAUF_MS // RAHMEN_MS)
        self.satz = []
        self.stille_rahmen = 0
        self.spricht = False

    def fuettern(self, roh: bytes):
        """Ton hineingeben, fertige Saetze herausbekommen."""
        fertige = []
        daten = self.rest + roh
        anzahl = len(daten) // RAHMEN_BYTES
        self.rest = daten[anzahl * RAHMEN_BYTES:]

        for i in range(anzahl):
            rahmen = daten[i * RAHMEN_BYTES:(i + 1) * RAHMEN_BYTES]
            ist_sprache = MODELLE["vad"].is_speech(rahmen, ABTASTRATE)

            if ist_sprache:
                if not self.spricht:
                    self.spricht = True
                    self.satz = list(self.vorlauf)     # Vorlauf, sonst fehlt der erste Laut
                self.satz.append(rahmen)
                self.stille_rahmen = 0
            else:
                self.vorlauf.append(rahmen)
                if self.spricht:
                    self.satz.append(rahmen)
                    self.stille_rahmen += 1
                    if self.stille_rahmen >= self.stille_rahmen_noetig:
                        fertige.append(self.abschliessen())

            if self.spricht and len(self.satz) * RAHMEN_MS >= MAX_SATZ_MS:
                fertige.append(self.abschliessen())

        return [f for f in fertige if f is not None]

    def verwerfen(self):
        """
        Angefangenen Satz wegwerfen.

        Wird gerufen, wenn das Geraet der Gegenseite gerade den Lautsprecher
        benutzt und deshalb kein Ton mehr kommt. Ohne das wuerde das Stueck
        vor der Pause spaeter an das Stueck danach angeklebt - zwei halbe
        Saetze ergaeben einen falschen ganzen.
        """
        self.rest = b""
        self.satz = []
        self.vorlauf.clear()
        self.stille_rahmen = 0
        self.spricht = False

    def abschliessen(self):
        rahmen, self.satz = self.satz, []
        self.spricht = False
        self.stille_rahmen = 0
        if len(rahmen) * RAHMEN_MS < 300:              # zu kurz, wohl nur ein Huesteln
            return None
        roh = b"".join(rahmen)
        return np.frombuffer(roh, dtype=np.int16).astype(np.float32) / 32768.0


class Raum:
    """
    Alle, die dasselbe Kennwort eingegeben haben.

    Fuer zwei Seiten gedacht, funktioniert aber auch mit mehr - dann
    bekommt jede andere Seite die Uebersetzung in ihre eigene Sprache.
    """

    def __init__(self, kennwort: str):
        self.kennwort = kennwort
        self.leute = {}                                # id -> Teilnehmer
        self.schloss = asyncio.Lock()

    def dazu(self, kennung: str, teilnehmer: Teilnehmer):
        self.leute[kennung] = teilnehmer

    def weg(self, kennung: str):
        self.leute.pop(kennung, None)

    def andere(self, kennung: str):
        return [(k, t) for k, t in self.leute.items() if k != kennung]


RAEUME = {}
RAEUME_SCHLOSS = asyncio.Lock()


async def raum_holen(kennwort: str) -> Raum:
    async with RAEUME_SCHLOSS:
        if kennwort not in RAEUME:
            RAEUME[kennwort] = Raum(kennwort)
        return RAEUME[kennwort]


async def raum_aufraeumen(kennwort: str):
    async with RAEUME_SCHLOSS:
        raum = RAEUME.get(kennwort)
        if raum is not None and not raum.leute:
            del RAEUME[kennwort]


async def lage_melden(raum: Raum):
    """Jeder Seite sagen, wer sonst noch da ist und welche Sprache spricht."""
    for kennung, teilnehmer in list(raum.leute.items()):
        gegenueber = [
            {"name": t.name, "sprache": t.sprache}
            for _, t in raum.andere(kennung)
        ]
        try:
            await teilnehmer.dose.send_text(json.dumps({
                "typ": "lage",
                "raum": raum.kennwort,
                "gegenueber": gegenueber,
            }))
        except Exception:
            pass


# --------------------------------------------------------------------------
# Verbindung
# --------------------------------------------------------------------------

@app.websocket("/ws")
async def dolmetschen(dose: WebSocket):
    await dose.accept()
    schleife = asyncio.get_running_loop()

    raum = None
    kennung = str(id(dose))
    ich = None

    try:
        while True:
            nachricht = await dose.receive()

            # ---------- Steuerbefehle ----------
            if nachricht.get("text") is not None:
                try:
                    befehl = json.loads(nachricht["text"])
                except json.JSONDecodeError:
                    continue

                if befehl.get("typ") == "start":
                    sprache = befehl.get("sprache") or befehl.get("quelle") or "de"
                    if sprache not in SPRACHEN:
                        await dose.send_text(json.dumps({
                            "typ": "fehler",
                            "text": "Sprache wird nicht unterstützt: %s" % sprache,
                        }))
                        continue

                    kennwort = str(befehl.get("raum") or "")[:40] or ("einzel-" + kennung)
                    ich = Teilnehmer(
                        dose, sprache,
                        str(befehl.get("name") or "")[:60] or "Teilnehmer",
                        bool(befehl.get("stimme", True)),
                        int(befehl.get("pause", STILLE_MS)),
                    )
                    raum = await raum_holen(kennwort)
                    async with raum.schloss:
                        raum.dazu(kennung, ich)

                    log.info("Raum %s: %s ist da (%s). Jetzt %d Seite(n).",
                             kennwort, ich.name, sprache, len(raum.leute))
                    await dose.send_text(json.dumps({"typ": "bereit"}))
                    await lage_melden(raum)

                elif befehl.get("typ") in ("pause", "weiter"):
                    # Lautsprecherbetrieb: das Geraet schweigt, waehrend es
                    # vorliest. Angefangenes verwerfen, damit nichts verklebt.
                    if ich is not None:
                        ich.verwerfen()

                elif befehl.get("typ") == "ende":
                    break
                continue

            # ---------- Ton ----------
            roh = nachricht.get("bytes")
            if not roh or ich is None or raum is None:
                continue

            for ton in ich.fuettern(roh):
                await verarbeiten(raum, kennung, ich, ton, schleife)

    except WebSocketDisconnect:
        pass
    except Exception as fehler:                    # noqa: BLE001 - nie hart abreissen
        log.exception("Fehler im Gespräch: %s", fehler)
        try:
            await dose.send_text(json.dumps({
                "typ": "fehler", "text": "Verarbeitung abgebrochen.",
            }))
        except Exception:
            pass
    finally:
        if raum is not None:
            async with raum.schloss:
                raum.weg(kennung)
            await lage_melden(raum)
            await raum_aufraeumen(raum.kennwort)
        log.info("Verbindung beendet. Kein Ton wurde gespeichert.")


async def verarbeiten(raum: Raum, kennung: str, ich: Teilnehmer, ton, schleife):
    """
    Einen gesprochenen Satz mitschreiben und an alle anderen Seiten
    in deren Sprache weitergeben.

    Wichtig fuer die Ohrhoerer-Betriebsart: die gesprochene Fassung
    geht an die GEGENSEITE. Die sprechende Person bekommt nur den
    eigenen Text zurueck, damit sie sieht, was verstanden wurde.
    """
    text, zuversicht = await schleife.run_in_executor(
        None, mitschreiben, ton, ich.sprache
    )
    if not text:
        return

    # Der sprechenden Seite zeigen, was angekommen ist
    try:
        await ich.dose.send_text(json.dumps({
            "typ": "eigen",
            "text": text,
            "sprache": ich.sprache,
            "sicherheit": round(zuversicht, 3),
        }))
    except Exception:
        return

    gegenueber = raum.andere(kennung)
    if not gegenueber:
        # Niemand sonst im Raum: zum Ausprobieren trotzdem uebersetzen,
        # damit man allein pruefen kann, ob alles laeuft.
        await allein_pruefen(ich, text, schleife)
        return

    # Gleiche Zielsprache nur einmal uebersetzen
    nach_sprache = {}
    for _, anderer in gegenueber:
        nach_sprache.setdefault(anderer.sprache, []).append(anderer)

    for zielsprache, empfaenger in nach_sprache.items():
        if zielsprache == ich.sprache:
            uebersetzt = text                      # gleiche Sprache, nichts zu tun
        else:
            uebersetzt = await schleife.run_in_executor(
                None, uebersetzen, text, ich.sprache, zielsprache
            )

        wav = None
        if any(e.mit_stimme for e in empfaenger) and uebersetzt:
            wav = await schleife.run_in_executor(None, vorlesen, uebersetzt, zielsprache)

        for empfaenger_einzeln in empfaenger:
            try:
                await empfaenger_einzeln.dose.send_text(json.dumps({
                    "typ": "gegenseite",
                    "von": ich.name,
                    "original": text,
                    "quelle": ich.sprache,
                    "uebersetzt": uebersetzt,
                    "ziel": zielsprache,
                    "sicherheit": round(zuversicht, 3),
                }))
                if wav and empfaenger_einzeln.mit_stimme:
                    await empfaenger_einzeln.dose.send_text(json.dumps({
                        "typ": "stimme", "laenge": len(wav),
                    }))
                    await empfaenger_einzeln.dose.send_bytes(wav)
            except Exception:
                continue


async def allein_pruefen(ich: Teilnehmer, text: str, schleife):
    """
    Allein im Raum: in die naechstliegende andere Sprache uebersetzen
    und zurueckschicken. Nur zum Pruefen der Einrichtung gedacht -
    im Betrieb sitzt immer jemand auf der Gegenseite.
    """
    probe = "ro" if ich.sprache == "de" else "de"
    uebersetzt = await schleife.run_in_executor(
        None, uebersetzen, text, ich.sprache, probe
    )
    try:
        await ich.dose.send_text(json.dumps({
            "typ": "probe",
            "original": text,
            "uebersetzt": uebersetzt,
            "quelle": ich.sprache,
            "ziel": probe,
        }))
        if ich.mit_stimme:
            wav = await schleife.run_in_executor(None, vorlesen, uebersetzt, probe)
            if wav:
                await ich.dose.send_text(json.dumps({"typ": "stimme", "laenge": len(wav)}))
                await ich.dose.send_bytes(wav)
    except Exception:
        pass
