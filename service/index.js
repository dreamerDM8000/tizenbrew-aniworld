/**
 * AniWorld TizenBrew Service
 * Verhindert, dass der TV in den Standby geht während ein Video läuft
 */
(function () {
  if (window.tizen) {
    try {
      tizen.power.request('SCREEN', 'SCREEN_NORMAL');
      console.log('[AniWorld Service] Anti-Standby aktiviert');
    } catch (e) {
      console.warn('[AniWorld Service] Power API nicht verfügbar:', e);
    }
  }
})();
