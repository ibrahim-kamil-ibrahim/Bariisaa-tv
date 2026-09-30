{{flutter_js}}
{{flutter_build_config}}

_flutter.loader.load({
  onEntrypointLoaded: async function(engineInitializer) {
    // Wait for Noto fonts preloaded in index.html
    if (window._notoFontsLoaded) {
      await window._notoFontsLoaded;
    }
    await document.fonts.ready;
    
    let appRunner = await engineInitializer.initializeEngine({
      renderer: 'html'
    });
    await appRunner.runApp();
  }
});
