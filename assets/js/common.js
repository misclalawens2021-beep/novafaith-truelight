/* Outils communs : session, panier PAR COMPTE, et traduction (EN / FR / ES / DE) */
(function () {
    const NF = window.NF = window.NF || {};
    const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };

    // ---------- Session et panier (un panier par compte) ----------
    NF.session = () => safe(() => {
        const s = JSON.parse(localStorage.getItem('novafaith-session'));
        return s && s.email ? s : null;
    }, null);
    NF.cartKey = email => 'novafaith-cart:' + (email || (NF.session() || {}).email || 'guest');
    NF.readCart = key => safe(() => {
        const c = JSON.parse(localStorage.getItem(key || NF.cartKey()));
        return Array.isArray(c) ? c : [];
    }, []);
    NF.saveCart = (cart, key) => safe(() => localStorage.setItem(key || NF.cartKey(), JSON.stringify(cart)));
    // À la connexion, le panier « invité » est ajouté à celui du compte
    NF.mergeGuestCart = email => {
        const guestKey = NF.cartKey('guest');
        const guest = NF.readCart(guestKey);
        if (!guest.length) return;
        const userKey = NF.cartKey(email);
        const cart = NF.readCart(userKey);
        guest.forEach(g => {
            const it = cart.find(i => i.id === g.id);
            if (it) it.qty += g.qty; else cart.push(g);
        });
        NF.saveCart(cart, userKey);
        safe(() => localStorage.removeItem(guestKey));
    };
    safe(() => localStorage.removeItem('novafaith-cart')); // ancien panier partagé par tout le navigateur

    // ---------- Traductions : [en, fr, es, de] ----------
    const LANGS = ['en', 'fr', 'es', 'de'];
    const D = {
        'ui.top': ['Back to top', 'Retour en haut', 'Volver arriba', 'Nach oben'],
        'ui.image': ['Image', 'Image', 'Imagen', 'Bild'],
        'footer.rights': ['All rights reserved', 'Tous droits réservés', 'Todos los derechos reservados', 'Alle Rechte vorbehalten'],
        'nav.home': ['Home', 'Accueil', 'Inicio', 'Startseite'],
        'nav.about': ['What is NovaFaith ?', "Qu'est-ce que NovaFaith ?", '¿Qué es NovaFaith?', 'Was ist NovaFaith?'],
        'nav.collection': ['The NovaFaith Collection', 'La collection NovaFaith', 'La colección NovaFaith', 'Die NovaFaith-Kollektion'],
        'nav.contact': ['Contact Me', 'Me contacter', 'Contáctame', 'Kontakt'],
        'nav.account': ['Account', 'Compte', 'Cuenta', 'Konto'],
        'nav.orders': ['My orders', 'Mes commandes', 'Mis pedidos', 'Meine Bestellungen'],
        'nav.login': ['Log in', 'Connexion', 'Iniciar sesión', 'Anmelden'],
        'nav.cart': ['Cart', 'Panier', 'Carrito', 'Warenkorb'],
        'nav.continue': ['Continue shopping', 'Continuer mes achats', 'Seguir comprando', 'Weiter einkaufen'],
        'home.welcome': ['WELCOME TO', 'BIENVENUE CHEZ', 'BIENVENIDO A', 'WILLKOMMEN BEI'],
        'home.about.d': ['Our story and our mission.', 'Notre histoire et notre mission.', 'Nuestra historia y nuestra misión.', 'Unsere Geschichte und unsere Mission.'],
        'home.coll.d': ['Discover the pieces.', 'Découvrez les pièces.', 'Descubre las piezas.', 'Entdecke die Stücke.'],
        'home.contact.d': ['A question about the brand or your faith ?', 'Une question sur la marque ou sur ta foi ?', '¿Una pregunta sobre la marca o tu fe?', 'Eine Frage zur Marke oder zu deinem Glauben?'],
        'about.etym': ["NovaFaith =<br>Faith's explosion.", "NovaFaith =<br>L'explosion de la foi.", 'NovaFaith =<br>La explosión de la fe.', 'NovaFaith =<br>Die Explosion des Glaubens.'],
        'about.goal': [
            'The goal of this brand is to ignite and spread our faith in Jesus Christ to every nation, so that they may become disciples of Christ and know that <strong>the righteous will live by Faith.</strong>',
            "Le but de cette marque est d'enflammer et de répandre notre foi en Jésus-Christ auprès de toutes les nations, afin qu'elles deviennent disciples du Christ et sachent que <strong>le juste vivra par la foi.</strong>",
            'El objetivo de esta marca es encender y difundir nuestra fe en Jesucristo a todas las naciones, para que lleguen a ser discípulos de Cristo y sepan que <strong>el justo vivirá por la fe.</strong>',
            'Das Ziel dieser Marke ist es, unseren Glauben an Jesus Christus in alle Nationen zu tragen, damit sie Jünger Christi werden und wissen, dass <strong>der Gerechte aus Glauben leben wird.</strong>'],
        'coll.title': ['THE NOVAFAITH COLLECTION', 'LA COLLECTION NOVAFAITH', 'LA COLECCIÓN NOVAFAITH', 'DIE NOVAFAITH-KOLLEKTION'],
        'coll.add': ['ADD TO CART', 'AJOUTER AU PANIER', 'AÑADIR AL CARRITO', 'IN DEN WARENKORB'],
        'contact.title': ['CONTACT ME', 'ME CONTACTER', 'CONTÁCTAME', 'KONTAKT'],
        'contact.sub': ['Any question about collection or your faith ? Send us a message !', 'Une question sur la collection ou sur ta foi ? Envoie-nous un message !', '¿Alguna pregunta sobre la colección o tu fe? ¡Envíanos un mensaje!', 'Fragen zur Kollektion oder zu deinem Glauben? Schreib uns eine Nachricht!'],
        'contact.send': ['SEND MESSAGE', 'ENVOYER LE MESSAGE', 'ENVIAR MENSAJE', 'NACHRICHT SENDEN'],
        'contact.social': ['My social media', 'Mes réseaux sociaux', 'Mis redes sociales', 'Meine sozialen Medien'],
        'contact.sending': ['SENDING...', 'ENVOI...', 'ENVIANDO...', 'WIRD GESENDET...'],
        'contact.sent': ['SENT ✅', 'ENVOYÉ ✅', 'ENVIADO ✅', 'GESENDET ✅'],
        'contact.error': ['ERROR', 'ERREUR', 'ERROR', 'FEHLER'],
        'contact.ok': ['Message sent. God bless you!', 'Message envoyé. Que Dieu te bénisse !', 'Mensaje enviado. ¡Dios te bendiga!', 'Nachricht gesendet. Gott segne dich!'],
        'contact.fail': ['Something went wrong. Please try again in a moment.', 'Une erreur est survenue. Réessaie dans un instant.', 'Algo salió mal. Inténtalo de nuevo en un momento.', 'Etwas ist schiefgelaufen. Bitte versuche es gleich noch einmal.'],
        'err.fill': ['Please fill in all the fields.', 'Merci de remplir tous les champs.', 'Por favor, rellena todos los campos.', 'Bitte fülle alle Felder aus.'],
        'err.email': ['Please enter a valid email address.', 'Merci de saisir une adresse e-mail valide.', 'Introduce un correo electrónico válido.', 'Bitte gib eine gültige E-Mail-Adresse ein.'],
        'ph.name': ['Your Name', 'Ton nom', 'Tu nombre', 'Dein Name'],
        'ph.email2': ['Your Email', 'Ton e-mail', 'Tu correo electrónico', 'Deine E-Mail'],
        'ph.msg': ['How can we help you?', "Comment pouvons-nous t'aider ?", '¿Cómo podemos ayudarte?', 'Wie können wir dir helfen?'],
        'ph.email': ['Email', 'E-mail', 'Correo electrónico', 'E-Mail'],
        'ph.pw': ['Password', 'Mot de passe', 'Contraseña', 'Passwort'],
        'ph.confirm': ['Confirm password', 'Confirmer le mot de passe', 'Confirmar contraseña', 'Passwort bestätigen'],
        'ph.fullname': ['Full name', 'Nom complet', 'Nombre completo', 'Vollständiger Name'],
        'ph.address': ['Address', 'Adresse', 'Dirección', 'Adresse'],
        'ph.zip': ['Postal code', 'Code postal', 'Código postal', 'Postleitzahl'],
        'ph.city': ['City', 'Ville', 'Ciudad', 'Stadt'],
        'ph.country': ['Country', 'Pays', 'País', 'Land'],
        'ph.cardname': ['Name on card', 'Nom sur la carte', 'Nombre en la tarjeta', 'Name auf der Karte'],
        'ph.cardnum': ['Card number', 'Numéro de carte', 'Número de tarjeta', 'Kartennummer'],
        'ph.exp': ['MM/YY', 'MM/AA', 'MM/AA', 'MM/JJ'],
        'auth.login': ['Log in', 'Connexion', 'Iniciar sesión', 'Anmelden'],
        'auth.create': ['Create account', 'Créer un compte', 'Crear cuenta', 'Konto erstellen'],
        'auth.createTitle': ['Create your account', 'Crée ton compte', 'Crea tu cuenta', 'Erstelle dein Konto'],
        'auth.showpw': ['Show password', 'Afficher le mot de passe', 'Mostrar contraseña', 'Passwort anzeigen'],
        'auth.showpws': ['Show passwords', 'Afficher les mots de passe', 'Mostrar contraseñas', 'Passwörter anzeigen'],
        'auth.rules': ['At least 8 characters, with a letter and a number.', 'Au moins 8 caractères, avec une lettre et un chiffre.', 'Al menos 8 caracteres, con una letra y un número.', 'Mindestens 8 Zeichen, mit einem Buchstaben und einer Zahl.'],
        'auth.btnLogin': ['LOG IN', 'SE CONNECTER', 'INICIAR SESIÓN', 'ANMELDEN'],
        'auth.btnCreate': ['CREATE ACCOUNT', 'CRÉER LE COMPTE', 'CREAR CUENTA', 'KONTO ERSTELLEN'],
        'auth.btnLogout': ['LOG OUT', 'SE DÉCONNECTER', 'CERRAR SESIÓN', 'ABMELDEN'],
        'auth.demo': ['Demo: accounts are stored in this browser only. Passwords are never saved in clear text.', 'Démo : les comptes sont stockés uniquement dans ce navigateur. Les mots de passe ne sont jamais enregistrés en clair.', 'Demo: las cuentas se guardan solo en este navegador. Las contraseñas nunca se guardan en texto claro.', 'Demo: Konten werden nur in diesem Browser gespeichert. Passwörter werden nie im Klartext gespeichert.'],
        'auth.welcome': ['Welcome, {name}!', 'Bienvenue, {name} !', '¡Bienvenido, {name}!', 'Willkommen, {name}!'],
        'auth.or': ['or', 'ou', 'o', 'oder'],
        'auth.google': ['Continue with Google', 'Continuer avec Google', 'Continuar con Google', 'Weiter mit Google'],
        'auth.facebook': ['Continue with Facebook', 'Continuer avec Facebook', 'Continuar con Facebook', 'Weiter mit Facebook'],
        'auth.err.secure': ['Open the site over https or localhost to use accounts.', 'Ouvre le site en https ou en localhost pour utiliser les comptes.', 'Abre el sitio con https o localhost para usar las cuentas.', 'Öffne die Seite über https oder localhost, um Konten zu nutzen.'],
        'auth.err.cred': ['Please enter your email and password.', 'Saisis ton e-mail et ton mot de passe.', 'Introduce tu correo y tu contraseña.', 'Bitte gib deine E-Mail und dein Passwort ein.'],
        'auth.err.wrong': ['Incorrect email or password.', 'E-mail ou mot de passe incorrect.', 'Correo o contraseña incorrectos.', 'E-Mail oder Passwort falsch.'],
        'auth.err.name': ['Please enter your full name.', 'Saisis ton nom complet.', 'Introduce tu nombre completo.', 'Bitte gib deinen vollständigen Namen ein.'],
        'auth.err.pw': ['The password needs at least 8 characters, with a letter and a number.', 'Le mot de passe doit contenir au moins 8 caractères, avec une lettre et un chiffre.', 'La contraseña necesita al menos 8 caracteres, con una letra y un número.', 'Das Passwort braucht mindestens 8 Zeichen, mit einem Buchstaben und einer Zahl.'],
        'auth.err.match': ['The passwords do not match.', 'Les mots de passe ne correspondent pas.', 'Las contraseñas no coinciden.', 'Die Passwörter stimmen nicht überein.'],
        'auth.err.exists': ['An account already exists with this email.', 'Un compte existe déjà avec cet e-mail.', 'Ya existe una cuenta con este correo.', 'Mit dieser E-Mail existiert bereits ein Konto.'],
        'auth.err.save': ['Could not save the account in this browser.', "Impossible d'enregistrer le compte dans ce navigateur.", 'No se pudo guardar la cuenta en este navegador.', 'Das Konto konnte in diesem Browser nicht gespeichert werden.'],
        'auth.err.social': ['{p} sign-in needs an ID: add it at the top of auth.js.', 'La connexion {p} nécessite un identifiant : ajoute-le en haut de auth.js.', 'El inicio de sesión con {p} necesita un ID: añádelo al principio de auth.js.', 'Für die Anmeldung mit {p} wird eine ID benötigt: trage sie oben in auth.js ein.'],
        'auth.err.socialFail': ['Sign-in failed. Please try again.', 'La connexion a échoué. Réessaie.', 'Error al iniciar sesión. Inténtalo de nuevo.', 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.'],
        'co.title': ['Checkout', 'Paiement', 'Pago', 'Kasse'],
        'co.empty': ['Your cart is empty.', 'Ton panier est vide.', 'Tu carrito está vacío.', 'Dein Warenkorb ist leer.'],
        'co.back': ['Back to the collection', 'Retour à la collection', 'Volver a la colección', 'Zurück zur Kollektion'],
        'co.thanks': ['Thank you for your order!', 'Merci pour ta commande !', '¡Gracias por tu pedido!', 'Danke für deine Bestellung!'],
        'co.orderPre': ['Order', 'Commande', 'Pedido', 'Bestellung'],
        'co.orderPost': ['has been placed. God bless you!', 'a bien été enregistrée. Que Dieu te bénisse !', 'se ha realizado. ¡Dios te bendiga!', 'wurde aufgegeben. Gott segne dich!'],
        'co.viewOrders': ['View my orders', 'Voir mes commandes', 'Ver mis pedidos', 'Meine Bestellungen ansehen'],
        'co.home': ['Back to home', "Retour à l'accueil", 'Volver al inicio', 'Zurück zur Startseite'],
        'co.items': ['1. Your items', '1. Tes articles', '1. Tus artículos', '1. Deine Artikel'],
        'co.ship': ['2. Shipping address', '2. Adresse de livraison', '2. Dirección de envío', '2. Lieferadresse'],
        'co.pay': ['3. Payment', '3. Paiement', '3. Pago', '3. Zahlung'],
        'co.note': ['Demo checkout: no real payment is made and card details are never stored.', "Paiement de démonstration : aucun vrai paiement n'est effectué et les données de carte ne sont jamais enregistrées.", 'Pago de demostración: no se realiza ningún pago real y los datos de la tarjeta nunca se guardan.', 'Demo-Kasse: Es erfolgt keine echte Zahlung und Kartendaten werden nie gespeichert.'],
        'co.summary': ['Order summary', 'Récapitulatif', 'Resumen del pedido', 'Bestellübersicht'],
        'co.sumItems': ['Items', 'Articles', 'Artículos', 'Artikel'],
        'co.sumShip': ['Shipping', 'Livraison', 'Envío', 'Versand'],
        'co.total': ['Total', 'Total', 'Total', 'Gesamt'],
        'co.place': ['PLACE YOUR ORDER', 'PASSER LA COMMANDE', 'REALIZAR PEDIDO', 'BESTELLUNG AUFGEBEN'],
        'co.remove': ['Remove', 'Retirer', 'Quitar', 'Entfernen'],
        'co.free': ['Free', 'Offerte', 'Gratis', 'Kostenlos'],
        'co.freeOk': ['Your order qualifies for free shipping.', 'Ta commande bénéficie de la livraison offerte.', 'Tu pedido tiene envío gratuito.', 'Deine Bestellung wird kostenlos geliefert.'],
        'co.freeFrom': ['Free shipping from {min} ({left} to go).', 'Livraison offerte dès {min} (encore {left}).', 'Envío gratis desde {min} (faltan {left}).', 'Kostenloser Versand ab {min} (noch {left}).'],
        'co.processing': ['PROCESSING...', 'TRAITEMENT...', 'PROCESANDO...', 'WIRD VERARBEITET...'],
        'co.err.card': ['The card number is not valid.', "Le numéro de carte n'est pas valide.", 'El número de tarjeta no es válido.', 'Die Kartennummer ist ungültig.'],
        'co.err.exp': ['The expiry date is not valid.', "La date d'expiration n'est pas valide.", 'La fecha de caducidad no es válida.', 'Das Ablaufdatum ist ungültig.'],
        'co.err.cvc': ['The CVC is not valid.', "Le CVC n'est pas valide.", 'El CVC no es válido.', 'Der CVC ist ungültig.'],
        'orders.empty': ["You haven't ordered anything yet.", "Tu n'as encore rien commandé.", 'Todavía no has pedido nada.', 'Du hast noch nichts bestellt.'],
        'orders.discover': ['Discover the collection', 'Découvrir la collection', 'Descubrir la colección', 'Kollektion entdecken']
    };

    let lang = safe(() => localStorage.getItem('novafaith-lang'), null);
    if (!LANGS.includes(lang)) {                       // 1re visite : langue du navigateur si elle est gérée
        const n = (navigator.language || 'en').slice(0, 2).toLowerCase();
        lang = LANGS.includes(n) ? n : 'en';
    }

    NF.lang = () => lang;
    NF.locale = () => ({ en: 'en-GB', fr: 'fr-FR', es: 'es-ES', de: 'de-DE' })[lang];
    NF.t = (key, vars) => {
        const e = D[key];
        let s = e ? (e[LANGS.indexOf(lang)] || e[0]) : key;
        if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
        return s;
    };

    function apply() {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = NF.t(el.dataset.i18n); });
        document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = NF.t(el.dataset.i18nHtml); });
        document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = NF.t(el.dataset.i18nPh); });
        document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = NF.t(el.dataset.i18nTitle); });
        document.querySelectorAll('.nav-inline a[title]').forEach(a => {
            const s = a.querySelector('.nav-text');
            if (s) a.title = s.textContent;
        });
        document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
        const cur = document.getElementById('lang-current');
        if (cur) cur.textContent = lang.toUpperCase();
        document.dispatchEvent(new CustomEvent('nf:lang'));
    }

    NF.setLang = l => {
        if (!LANGS.includes(l)) return;
        lang = l;
        safe(() => localStorage.setItem('novafaith-lang', l));
        apply();
    };

    document.addEventListener('DOMContentLoaded', () => {
        apply();

        const btn = document.getElementById('lang-btn');
        const menu = document.getElementById('lang-menu');
        const close = () => { if (menu) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); } };

        document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { NF.setLang(b.dataset.lang); close(); }));

        if (btn && menu) {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                menu.hidden = !menu.hidden;
                btn.setAttribute('aria-expanded', String(!menu.hidden));
            });
            document.addEventListener('click', e => { if (!menu.contains(e.target)) close(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        }
    });
})();