// Sidebar state
let sidebarExpanded = false;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    
    // Safety check if sidebar doesn't exist on this page
    if (!sidebar || !backdrop) return;

    const isMobile = window.innerWidth < 1024;

    sidebarExpanded = !sidebarExpanded;
    sidebar.dataset.expanded = sidebarExpanded;

    if (isMobile) {
        // Mobile: slide in/out overlay
        if (sidebarExpanded) {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            backdrop.classList.remove('hidden');
        } else {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            backdrop.classList.add('hidden');
        }
    } else {
        // Desktop: push sidebar width toggle (only affects main content)
        if (sidebarExpanded) {
            sidebar.classList.remove('lg:w-0');
            sidebar.classList.add('lg:w-60');
        } else {
            sidebar.classList.remove('lg:w-60');
            sidebar.classList.add('lg:w-0');
        }
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');
    
    // Safety check
    if (!sidebar || !backdrop) return;

    const isMobile = window.innerWidth < 1024;

    if (!isMobile && sidebarExpanded) {
        // Reset mobile states when switching to desktop
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        backdrop.classList.add('hidden');
    } else if (isMobile && !sidebarExpanded) {
        // Hide sidebar on mobile when collapsed
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
    }
});
