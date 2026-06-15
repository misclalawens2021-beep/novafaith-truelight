document.addEventListener('DOMContentLoaded', () => {
    const shopButton = document.getElementById('shop-button');
    const header = document.querySelector('header');
    let cartCount = 0;

    // 1. Animation d'entrée
    if (header) {
        header.style.opacity = "0";
        header.style.transform = "translateY(20px)";
        header.style.transition = "opacity 1.5s ease, transform 5s ease";

        setTimeout(() => {
            header.style.opacity = "1";
            header.style.transform = "translateY(0)";
        }, 100);
    }

    // 2. Transition vers la boutique
    if (shopButton) {
        shopButton.addEventListener('click', () => {
            document.body.style.transition = 'opacity 4s ease';
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = 'vente.html';
            }, 600);
        });
    }

    // 3. Gestion du panier (Simple)
    const addButtons = document.querySelectorAll('.product-card .lm');
    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            cartCount++;
            // Message de confirmation simple
            alert(`Added to cart! Total products: ${cartCount}`); // Une fois que le bouton est cliqué, il ajoute le nombre de produits au panier
        });
    });
});

// Gestion du formulaire de contact
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = this.querySelector('button');
        const originalText = btn.innerText;
        
        // Effet de chargement sur le bouton
        btn.innerText = "SENDING...";
        btn.style.opacity = "0.7";
        btn.disabled = true;

        // Simulation d'envoi (2 secondes)
        setTimeout(() => {
            formStatus.innerHTML = "Message sent. God bless you!";
            formStatus.style.color = "#ffffff";
            formStatus.style.marginTop = "20px";
            
            btn.innerText = "SENT ✅";
            btn.style.backgroundColor = "#4CAF50";
            btn.style.color = "white";
            
            this.reset(); // Réinitialise les champs

            // Remet le bouton à la normale après 3 secondes
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = "white";
                btn.style.color = "black";
                btn.style.opacity = "1";
                btn.disabled = false;
                formStatus.innerHTML = "";
            }, 3000);
        }, 2000);
    });
}

// Gestion du bouton Retour en haut
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    // Si on a défilé de plus de 300px, on affiche le bouton
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

// Action du clic pour remonter de manière progressive
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // C'est ici que l'effet "progressif" se joue
    });
});

window.onscroll = function() {
    updateProgressBar();
};

function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    const progressBar = document.getElementById("myBar");
    if (progressBar) {
        progressBar.style.width = scrolled + "%";
    }
}

const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('nav-overlay');

if (hamburger && navOverlay) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navOverlay.classList.toggle('active');
    });

    // Fermer le menu après avoir cliqué sur un lien
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navOverlay.classList.remove('active');
        });
    });
}

document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le rechargement de la page

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };

    fetch('http://127.0.0.1:5000/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        const statusDiv = document.getElementById('form-status');
        if(data.status === 'success') {
            statusDiv.innerHTML = "<p style='color: green;'>Message envoyé avec succès !</p>";
            document.getElementById('contact-form').reset();
        } else {
            statusDiv.innerHTML = "<p style='color: red;'>Erreur lors de l'envoi.</p>";
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
    });
});