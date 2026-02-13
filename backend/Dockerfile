FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ src/
COPY mcp_server/ mcp_server/
COPY start.sh .
RUN chmod +x start.sh

# Create non-root user
RUN useradd -m appuser
USER appuser

# Hugging Face Spaces requires port 7860
EXPOSE 7860

CMD ["./start.sh"]
