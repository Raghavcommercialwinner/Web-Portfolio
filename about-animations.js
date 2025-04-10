
document.addEventListener('DOMContentLoaded', () => {

    const scrollReveal = {
      distance: '20px',
      duration: 1000,
      easing: 'cubic-bezier(0.5, 0, 0, 1)',
      viewFactor: 0.25
    };
  

    const aboutSection = document.querySelector('.about-container');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, scrollReveal);
  
    observer.observe(aboutSection);
  

    const profileImage = document.querySelector('.about-image img');
    profileImage.addEventListener('mousemove', (e) => {
      const x = e.offsetX;
      const y = e.offsetY;
      const rotateY = (-1/5 * x + 20);
      const rotateX = (1/5 * y - 20);
      
      profileImage.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
      `;
    });
  
    profileImage.addEventListener('mouseleave', () => {
      profileImage.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
  