# Static server for this folder plus POST /save, which writes drawings/drawing.json (plus drawing.js for index.html and a timestamped backup)
import http.server, json, os, time
class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/save': return self.send_error(404)
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        json.loads(body)  # reject non-JSON
        os.makedirs('drawings', exist_ok=True)
        for n in ('drawing.json', time.strftime('drawing-%H%M%S.json')):
            open('drawings/' + n, 'wb').write(body)
        open('drawings/drawing.js', 'wb').write(b'window.DRAWING=' + body)  # index.html loads this; a script tag also works from file://
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
http.server.ThreadingHTTPServer(('127.0.0.1', 8000), H).serve_forever()
