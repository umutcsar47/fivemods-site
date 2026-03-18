import http.server
import os
import ssl
from pathlib import Path

PORT = 8000
BASE_DIR = Path(__file__).resolve().parent
CERT_DIR = BASE_DIR / "cert"
CERT_FILE = CERT_DIR / "fivemods.local.pem"
KEY_FILE = CERT_DIR / "fivemods.local-key.pem"

os.chdir(BASE_DIR)

handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), handler)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print("Serving HTTPS on https://fivemods.local:{0} (root: {1})".format(PORT, BASE_DIR))
httpd.serve_forever()
