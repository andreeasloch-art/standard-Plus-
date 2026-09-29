# Standard Plus - Dolmetscher-Server
# Grundlage mit CUDA, damit Whisper auf der Grafikkarte laeuft.
# Ohne Grafikkarte: FROM python:3.11-slim und SP_GERAET=cpu setzen.
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/modelle/huggingface

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3.11 python3-pip ffmpeg wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Piper fuer die Sprachausgabe
RUN wget -qO /tmp/piper.tar.gz \
      https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz \
 && tar -xzf /tmp/piper.tar.gz -C /opt && rm /tmp/piper.tar.gz
ENV PATH="/opt/piper:${PATH}"

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY server.py .

# Modelle und Stimmen liegen im eingehaengten Verzeichnis, nicht im Abbild
VOLUME ["/modelle"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=180s \
  CMD python3 -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/gesundheit').status==200 else 1)"

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080", "--ws-ping-interval", "20"]
