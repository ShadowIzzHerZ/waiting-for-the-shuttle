package app.carts;

import android.Manifest;
import android.app.Activity;
import android.graphics.Color;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {
  WebView w;
  GeolocationPermissions.Callback geoCb; String geoOrigin;
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(0xFFF8F6F1));
    w = new WebView(this);
    w.setBackgroundColor(0xFFF8F6F1);
    // targetSdk 35 draws edge-to-edge: keep the page out from under the status and nav bars
    w.setOnApplyWindowInsetsListener((v, i) -> { android.graphics.Insets s = i.getInsets(WindowInsets.Type.systemBars()); v.setPadding(s.left, s.top, s.right, s.bottom); return WindowInsets.CONSUMED; });
    WebSettings s = w.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setGeolocationEnabled(true);
    w.setWebChromeClient(new WebChromeClient() {
      @Override public void onGeolocationPermissionsShowPrompt(String o, GeolocationPermissions.Callback cb) {
        // ask for location only when the user taps Locate me, not at launch
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) { cb.invoke(o, true, false); return; }
        geoCb = cb; geoOrigin = o;
        requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, 1);
      }
    });
    w.loadUrl("file:///android_asset/index.html");
    setContentView(w);
  }
  @Override public void onRequestPermissionsResult(int code, String[] p, int[] g) {
    if (geoCb == null) return;
    boolean ok = false; for (int r : g) ok |= r == PackageManager.PERMISSION_GRANTED;
    geoCb.invoke(geoOrigin, ok, false); geoCb = null;
  }
  @Override protected void onPause() { super.onPause(); w.onPause(); }   // stop the animation loop in the background
  @Override protected void onResume() { super.onResume(); w.onResume(); }
  @Override public void onBackPressed() { if (w.canGoBack()) w.goBack(); else super.onBackPressed(); }
}
