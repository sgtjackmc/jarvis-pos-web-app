export function showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
  
    // ถ้ายังไม่มี element ให้สร้างใหม่เลย
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#28a745';
      toast.style.color = '#fff';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '5px';
      toast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      document.body.appendChild(toast);
    }
  
    toast.textContent = message;
    toast.classList.add('show');
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  
    // ซ่อน toast หลังเวลาที่กำหนด
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, duration);
  }
  