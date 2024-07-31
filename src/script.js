let menuOpen = false; // To track if the menu is open

document.getElementById('menu-icon').addEventListener('click', function() {
    var menu = document.getElementById('navigation-menu');
    if (menuOpen) {
        menu.style.right = '-350px'; // Move the menu completely out of view
        menuOpen = false; // Set menu state to closed
    } else {
        menu.style.right = '-70px'; // Show the menu
        menuOpen = true; // Set menu state to open
    }
});

// Add event listeners for scroll and click events to close the menu
window.addEventListener('scroll', closeMenuOnScroll);
document.addEventListener('click', closeMenu);

function closeMenu(event) {
    var menu = document.getElementById('navigation-menu');
    if (menuOpen && !menu.contains(event.target) && !document.getElementById('menu-icon').contains(event.target)) {
        menu.style.right = '-350px'; // Move the menu completely out of view
        menuOpen = false; // Set menu state to closed
    }
}

function closeMenuOnScroll() {
    var menu = document.getElementById('navigation-menu');
    if (menuOpen) {
        menu.style.right = '-350px'; // Move the menu completely out of view
        menuOpen = false; // Set menu state to closed
    }
}

// Tooltip functionality
document.querySelectorAll('.icon').forEach(icon => {
    icon.addEventListener('mouseenter', showTooltip);
    icon.addEventListener('mouseleave', hideTooltip);
});

function showTooltip(event) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    
    switch (event.target.classList[1]) {
        case 'login-icon':
            tooltip.innerText = 'Login';
            break;
        case 'cart-icon':
            tooltip.innerText = 'Shopping Cart';
            break;
        case 'menu-icon':
            tooltip.innerText = 'Navigation Menu';
            break;
    }

    document.body.appendChild(tooltip);
    positionTooltip(event, tooltip);

    event.target.tooltip = tooltip; // Attach the tooltip to the icon element
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
}

function hideTooltip(event) {
    const tooltip = event.target.tooltip;
    if (tooltip) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(tooltip);
        }, 200); // Remove after transition
    }
}

function positionTooltip(event, tooltip) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const iconRect = event.target.getBoundingClientRect();
    
    const top = iconRect.bottom + 5; // 5px gap below the icon
    const left = iconRect.left + (iconRect.width - tooltipRect.width) / 2;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}
