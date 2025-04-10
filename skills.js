document.addEventListener('DOMContentLoaded', function() {
    const skillsGrid = document.querySelector('.skills-grid');
    const tooltip = document.getElementById('tooltip');
    const skillDescriptions = {
        'JavaScript': 'Proficient in JavaScript can create drop-down menus, embedded videos, and dynamic interactions on web pages, such as displaying timely content updates, interactive maps, animated 2D/3D graphics, and scrolling video jukeboxes.',
        'CSS': 'Experience with Flexbox, Grid, and animations.',
        'HTML': 'Well-versed in semantic HTML and responsive design.',
        'C': 'Strong fundamentals in data structures and algorithms.',
        'C++': 'OOP concepts, STL, and competitive programming.',
        'Python': 'Machine learning, web scraping, and automation.',
        'Java': 'Object-oriented programming and Spring Boot.',
        'DSA': 'Solving problems using efficient algorithms and data structures.'
    };

    skillsGrid.addEventListener('mouseover', function(e) {
        const skill = e.target.closest('.skill');
        if (skill) {
            const skillName = skill.getAttribute('data-skill');
            tooltip.textContent = skillDescriptions[skillName];
            tooltip.classList.add('show');
        }
    });

    skillsGrid.addEventListener('mouseout', function() {
        tooltip.classList.remove('show');
    });
});
