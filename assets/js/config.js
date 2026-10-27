/* Réglages du site : à remplir UNE SEULE FOIS par le développeur (les visiteurs n'ont rien à faire).
   Quand un identifiant est renseigné, le bouton « Continuer avec … » ouvre la fenêtre officielle
   de Google / Facebook où le visiteur saisit lui-même son compte.

   Google   : console.cloud.google.com > API et services > Identifiants > Créer un « ID client OAuth »
              (type « Application Web »), puis ajoute l'adresse de ton site dans « Origines JavaScript autorisées ».
   Facebook : developers.facebook.com > Mes applications > créer une application « Facebook Login »,
              puis copie l'« ID de l'application » et ajoute ton domaine dans les paramètres. */
window.NF_CONFIG = {
    GOOGLE_CLIENT_ID: '',
    FACEBOOK_APP_ID: ''
};