/* Loads Firebase from Google's servers. fbInit(false) = website visitors (read only), fbInit(true) = admin panel. */
(function(){
var B='https://www.gstatic.com/firebasejs/10.12.2/',cache={};
window.fbConfigured=function(){var c=window.FIREBASE_CONFIG;return!!(c&&c.apiKey&&!/PASTE/.test(c.apiKey+c.projectId+c.appId))};
window.fbInit=function(withAuth){
  if(!fbConfigured())return Promise.reject(new Error('not-configured'));
  var k=withAuth?'a':'p';if(cache[k])return cache[k];
  var ps=[import(B+'firebase-app.js'),import(B+'firebase-firestore.js')];if(withAuth)ps.push(import(B+'firebase-auth.js'));
  return cache[k]=Promise.all(ps).then(function(m){
    var f=Object.assign({},m[0],m[1],m[2]||{});
    var app=f.getApps().length?f.getApp():f.initializeApp(window.FIREBASE_CONFIG);
    var o={f:f,db:f.getFirestore(app)};if(withAuth)o.auth=f.getAuth(app);return o});
};
})();
