document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('shapes-container');
    
    const shapes = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        size: Math.floor(Math.random() * 20) + 30,
        top: Math.random() * 110 - 10,
        left: Math.random() * 110 - 10,
        opacity: Math.random() * 0.5 + 0.2,
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        rotate: Math.random() * 360,
        radius: Math.random() * 250 + 100
    }));
    
    shapes.forEach((shape, i) => {
        const shapeElement = document.createElement('div');
        shapeElement.className = 'shape animate-border-rotate';
        
        shapeElement.style.height = `${shape.size}px`;
        shapeElement.style.width = `${shape.size}px`;
        shapeElement.style.left = `${shape.left}%`;
        shapeElement.style.top = `${shape.top}%`;
        shapeElement.style.opacity = shape.opacity;
        shapeElement.style.borderRadius = shape.borderRadius;
        shapeElement.style.animationDuration = `${shape.left * 0.02 + 3}s`
        
        container.appendChild(shapeElement);
    });
});
