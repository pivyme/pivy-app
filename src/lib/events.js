// Simple event emitter for link updates
const linkEvents = {
  listeners: new Set(),
  
  emit() {
    this.listeners.forEach(listener => listener());
  },

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

export { linkEvents }; 
