// ==================== RETRO WEBSITE JAVASCRIPT ====================

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initVisitorCounter();
    initScrollEffects();
});

// Clock functionality
function initClock() {
    const clockElement = document.getElementById('clock');
    
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// Visitor counter with animation
function initVisitorCounter() {
    const counterElement = document.getElementById('visitor-count');
    let count = parseInt(counterElement.textContent);
    
    // Increment counter every 5 seconds (fake visitors)
    setInterval(() => {
        count++;
        counterElement.textContent = String(count).padStart(9, '0');
    }, 5000);
    
    // Add glitch effect occasionally
    setInterval(() => {
        const originalText = counterElement.textContent;
        counterElement.textContent = Math.random().toString().substring(2, 11);
        setTimeout(() => {
            counterElement.textContent = originalText;
        }, 100);
    }, 15000);
}

// Guestbook functionality
function addGuestbookEntry(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('name-input');
    const messageInput = document.getElementById('message-input');
    const entriesContainer = document.getElementById('guestbook-entries');
    
    if (nameInput.value && messageInput.value) {
        // Create new entry
        const entry = document.createElement('div');
        entry.className = 'guestbook-entry';
        
        const date = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        entry.innerHTML = `
            <strong>${escapeHtml(nameInput.value)}</strong> - <em>${date}</em>
            <p>${escapeHtml(messageInput.value)}</p>
        `;
        
        // Add animation
        entry.style.opacity = '0';
        entry.style.transform = 'translateY(-20px)';
        
        entriesContainer.insertBefore(entry, entriesContainer.firstChild);
        
        // Animate in
        setTimeout(() => {
            entry.style.transition = 'all 0.5s ease';
            entry.style.opacity = '1';
            entry.style.transform = 'translateY(0)';
        }, 10);
        
        // Clear inputs
        nameInput.value = '';
        messageInput.value = '';
        
        // Show success message
        alert('? Thanks for signing the guestbook! You\'re awesome! ?');
    }
    
    return false;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll effects
function initScrollEffects() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add parallax effect to stars
        const stars = document.querySelector('.stars');
        if (stars) {
            stars.style.transform = `translateY(${currentScroll * 0.5}px)`;
        }
        
        lastScroll = currentScroll;
    });
}

// Konami code easter egg
(function() {
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateKonamiCode();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
    
    function activateKonamiCode() {
        // Create rainbow effect
        document.body.style.animation = 'rainbow 2s linear infinite';
        
        // Show alert
        alert('?? KONAMI CODE ACTIVATED! ??\n\nYou found the secret! You are now a certified 90s web master!');
        
        // Add extra stars
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Reset after 10 seconds
        setTimeout(() => {
            document.body.style.animation = '';
        }, 10000);
    }
})();

// Random page title changes
(function() {
    const titles = [
        '?? Welcome to My Cyber Space ??',
        '?? YOU ARE VISITOR #42069! ??',
        '? UNDER CONSTRUCTION ?',
        '?? ENTER IF YOU DARE ??',
        '?? RETRO ZONE 1999 ??',
        '? BEST SITE ON THE WEB ?'
    ];
    
    let titleIndex = 0;
    
    setInterval(() => {
        titleIndex = (titleIndex + 1) % titles.length;
        document.title = titles[titleIndex];
    }, 3000);
})();

// Cursor trail effect
(function() {
    const colors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'];
    let colorIndex = 0;
    
    document.addEventListener('mousemove', (e) => {
        if (Math.random() > 0.8) {
            const trail = document.createElement('div');
            trail.style.position = 'fixed';
            trail.style.left = e.clientX + 'px';
            trail.style.top = e.clientY + 'px';
            trail.style.width = '5px';
            trail.style.height = '5px';
            trail.style.borderRadius = '50%';
            trail.style.backgroundColor = colors[colorIndex];
            trail.style.pointerEvents = 'none';
            trail.style.zIndex = '9999';
            trail.style.transition = 'all 0.5s ease';
            
            document.body.appendChild(trail);
            
            colorIndex = (colorIndex + 1) % colors.length;
            
            setTimeout(() => {
                trail.style.opacity = '0';
                trail.style.transform = 'scale(2)';
            }, 10);
            
            setTimeout(() => {
                trail.remove();
            }, 500);
        }
    });
})();

// Add click sound effect to buttons (using Web Audio API)
(function() {
    const buttons = document.querySelectorAll('.nav-button, .submit-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Create a simple beep sound
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                // Silent fail if audio context not supported
            }
        });
    });
})();

// Make the page title blink in the browser tab
(function() {
    let isOriginalTitle = true;
    const originalTitle = document.title;
    const blinkTitle = '? NEW! CHECK THIS OUT! ?';
    
    setInterval(() => {
        if (document.hidden) {
            document.title = isOriginalTitle ? blinkTitle : originalTitle;
            isOriginalTitle = !isOriginalTitle;
        } else {
            document.title = originalTitle;
            isOriginalTitle = true;
        }
    }, 1000);
})();

// Console message for curious developers
console.log('%c?? WELCOME TO THE SOURCE CODE! ??', 'font-size: 20px; color: #00ff00; background: #000; padding: 10px;');
console.log('%cYou found the developer console! Here\'s a cookie: ??', 'font-size: 14px; color: #ff00ff;');
console.log('%cThis site was made with ?? and lots of nostalgia', 'font-size: 12px; color: #00ffff;');
console.log('%cTip: Try pressing ????????BA for a surprise!', 'font-size: 12px; color: #ffff00;');
