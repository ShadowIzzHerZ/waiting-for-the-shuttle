package app.carts;

import android.Manifest;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {
  WebView w;
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
    getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(0xFF0F3D3E));
    w = new WebView(this);
    w.setBackgroundColor(0xFF0F3D3E);
    // targetSdk 35 draws edge-to-edge: keep the page out from under the status and nav bars
    w.setOnApplyWindowInsetsListener((v, i) -> { android.graphics.Insets s = i.getInsets(WindowInsets.Type.systemBars()); v.setPadding(s.left, s.top, s.right, s.bottom); return WindowInsets.CONSUMED; });
    WebSettings s = w.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setGeolocationEnabled(true);
    w.setWebChromeClient(new WebChromeClient() {
      @Override public void onGeolocationPermissionsShowPrompt(String o, GeolocationPermissions.Callback cb) { cb.invoke(o, true, false); }
    });
    w.loadUrl("file:///android_asset/index.html");
    setContentView(w);
  }
  @Override public void onBackPressed() { if (w.canGoBack()) w.goBack(); else super.onBackPressed(); }
}
