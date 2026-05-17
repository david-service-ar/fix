FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8080

CMD ["gunicorn", "fix_core.asgi:application", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8080", "--workers", "1", "--timeout", "120"]
