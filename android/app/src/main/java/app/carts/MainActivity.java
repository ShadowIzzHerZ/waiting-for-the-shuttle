package app.carts;

import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class MainActivity extends Activity {
  WebView w;
  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
    w = new WebView(this);
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
