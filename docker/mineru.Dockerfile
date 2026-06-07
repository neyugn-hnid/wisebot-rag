FROM python:3.12-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl \
      fonts-noto-core \
      fonts-noto-cjk \
      fontconfig \
      libgl1 \
      libglib2.0-0 && \
    fc-cache -fv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir -U "mineru[core]>=3.2.1" && \
    python3 -m pip cache purge

RUN mineru-models-download -s huggingface -m all

ENV MINERU_MODEL_SOURCE=local
ENV MINERU_API_OUTPUT_ROOT=/app/output

EXPOSE 8000

ENTRYPOINT ["mineru-api"]
CMD ["--host", "0.0.0.0", "--port", "8000"]
