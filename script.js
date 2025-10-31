// Retro Website JavaScript
// Because every 90s site needs some JavaScript!

// Update visitor counter with random increment
function updateCounter() {
    const counter = document.getElementById('counter');
    let currentCount = parseInt(counter.textContent) || 1337;
    
    // Random increment between 1-5
    currentCount += Math.floor(Math.random() * 5) + 1;
    counter.textContent = currentCount;
    
    // Add flash effect
    counter.style.color = '#ffff00';
    counter.style.textShadow = '0 0 20px #ffff00';
    
    setTimeout(() => {
        counter.style.color = '';
        counter.style.textShadow = '';
    }, 500);
}

// Update date
function updateDate() {
    const dateElement = document.getElementById('date');
    if (dateElement) {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        dateElement.textContent = dateString.toUpperCase();
    }
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Update counter periodically
    setInterval(updateCounter, 5000);
    
    // Update date
    updateDate();
    
    // Handle navigation clicks
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Add flash effect
                targetSection.style.border = '3px solid #ff00ff';
                targetSection.style.boxShadow = '0 0 30px #ff00ff';
                
                setTimeout(() => {
                    targetSection.style.border = '';
                    targetSection.style.boxShadow = '';
                }, 1000);
                
                // Smooth scroll
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Handle form submission
    const retroForm = document.querySelector('.retro-form');
    if (retroForm) {
        retroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show retro alert
            alert('THANK YOU FOR SIGNING MY GUESTBOOK!\n\nYour entry has been "saved" to the server!\n(Just like in the 90s!)');
            
            // Flash effect
            this.style.border = '2px dashed #ff00ff';
            this.style.boxShadow = '0 0 20px #ff00ff';
            
            setTimeout(() => {
                this.style.border = '';
                this.style.boxShadow = '';
                this.reset();
            }, 2000);
        });
    }
    
    // Add random mouse trail effect (90s style!)
    let trail = [];
    const maxTrailLength = 20;
    
    document.addEventListener('mousemove', function(e) {
        // Create trail element occasionally
        if (Math.random() > 0.7) {
            const trailElement = document.createElement('div');
            trailElement.className = 'mouse-trail';
            trailElement.style.position = 'fixed';
            trailElement.style.left = e.clientX + 'px';
            trailElement.style.top = e.clientY + 'px';
            trailElement.style.width = '4px';
            trailElement.style.height = '4px';
            trailElement.style.background = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00'][Math.floor(Math.random() * 4)];
            trailElement.style.borderRadius = '50%';
            trailElement.style.pointerEvents = 'none';
            trailElement.style.zIndex = '9999';
            document.body.appendChild(trailElement);
            
            setTimeout(() => {
                trailElement.style.opacity = '0';
                trailElement.style.transition = 'opacity 0.5s';
                setTimeout(() => trailElement.remove(), 500);
            }, 100);
        }
    });
    
    // Add random blink effects to elements
    const blinkables = document.querySelectorAll('h2, .content-box, .pixel-art');
    setInterval(() => {
        const randomElement = blinkables[Math.floor(Math.random() * blinkables.length)];
        randomElement.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            randomElement.style.filter = '';
        }, 200);
    }, 3000);
    
    // Console easter egg
    console.log('%c? RETRO ZONE ?', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    console.log('%cWelcome to the retro zone! Type "retroSecret()" for a surprise!', 'color: #ff00ff; font-size: 14px;');
    
    // Easter egg function
    window.retroSecret = function() {
        alert('?? YOU FOUND THE SECRET! ??\n\nYou are now officially RAD!');
        document.body.style.animation = 'none';
        setTimeout(() => {
            document.body.style.background = 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff)';
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.animation = 'gradientShift 2s ease infinite';
        }, 100);
    };
    
    // Create floating pixel art occasionally
    setInterval(() => {
        if (Math.random() > 0.8) {
            const pixel = document.createElement('div');
            pixel.textContent = ['?', '?', '?', '?'][Math.floor(Math.random() * 4)];
            pixel.style.position = 'fixed';
            pixel.style.left = Math.random() * 100 + '%';
            pixel.style.top = '-50px';
            pixel.style.color = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00'][Math.floor(Math.random() * 4)];
            pixel.style.fontSize = '30px';
            pixel.style.pointerEvents = 'none';
            pixel.style.zIndex = '9998';
            pixel.style.animation = 'floatDown 5s linear forwards';
            document.body.appendChild(pixel);
            
            setTimeout(() => pixel.remove(), 5000);
        }
    }, 2000);
    
    // Add float down animation if not exists
    if (!document.querySelector('style[data-float-animation]')) {
        const style = document.createElement('style');
        style.setAttribute('data-float-animation', 'true');
        style.textContent = `
            @keyframes floatDown {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(calc(100vh + 50px)) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});

// Add some terminal-style console messages
console.log('%c? RETRO WEBSITE INITIALIZED ?', 'color: #00ff00; font-weight: bold;');
console.log('%cLoading retro modules...', 'color: #00ffff;');
console.log('%c? Blink tags: ENABLED', 'color: #00ff00;');
console.log('%c? Marquee tags: ENABLED', 'color: #00ff00;');
console.log('%c? Neon effects: ENABLED', 'color: #00ff00;');
console.log('%c? Nostalgia mode: 100%', 'color: #ff00ff; font-weight: bold;');
