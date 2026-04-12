/**
 * simConfig: Đối tượng chứa các thông số cấu hình toàn cục cho toàn bộ môi trường mô phỏng.
 * Các thông số này thường được liên kết trực tiếp với giao diện điều khiển (Tweakpane)
 * để người dùng có thể tinh chỉnh theo thời gian thực (Real-time).
 */
export const simConfig = {
    // Hệ số thời gian: 1.0 - tốc độ bình thường, 0 - tạm dừng, < 0 - tua ngược
    timeScale: 1.0, 
    
    // Cờ bật/tắt hiệu ứng đổ bóng của các nguồn sáng 
    shadows: true,
    
    // Cờ bật/tắt thẻ nhãn HTML (CSS2DRenderer) hiển thị tên các hành tinh
    showLabels: true,
    
    // Cường độ của hiệu ứng hậu kỳ (Post-processing Bloom), tạo hiệu ứng glow giống như mist filter xung quanh các vật thể phát sáng như Mặt trời
    bloomStrength: 0.15,
    
    // Tần suất xuất hiện của sao băng trong mỗi khung hình
    meteorFreq: 0.01
};

/**
 * planetConfigs: Mảng chứa dữ liệu vật lý và đồ họa của các hành tinh và thiên thể (không bao gồm Mặt trời).
 * Mỗi đối tượng (object) trong mảng đại diện cho một thiên thể với các thuộc tính cụ thể.
 * * Ý nghĩa các thuộc tính:
 * - name: Tên hiển thị của hành tinh.
 * - radius: Kích thước (bán kính) mô phỏng của khối cầu.
 * - semiMajorAxis: Bán trục lớn của quỹ đạo hình Elip (khoảng cách trung bình từ tâm quỹ đạo đến Mặt trời).
 * - eccentricity: Độ lệch tâm của quỹ đạo (0 - hình tròn, > 0 và < 1 - hình Elip).
 * - tilt: Độ nghiêng của trục tự quay so với phương thẳng đứng (tính bằng độ).
 * - speed: Tốc độ di chuyển trên quỹ đạo quanh Mặt trời.
 * - texture: Đường dẫn đến file ảnh texture bề mặt.
 */
export const planetConfigs = [
    { name: "Mercury", radius: 0.4, semiMajorAxis: 6, eccentricity: 0.205, tilt: 0.03, speed: 0.02, texture: "/textures/2k_mercury.jpg" },
    { name: "Venus", radius: 0.7, semiMajorAxis: 9, eccentricity: 0.006, tilt: 177.3, speed: 0.015, texture: "/textures/2k_venus_surface.jpg" },
    { name: "Earth", radius: 0.9, semiMajorAxis: 13, eccentricity: 0.016, tilt: 23.4, speed: 0.01, texture: "/textures/2k_earth_daymap.jpg" },
    { name: "Mars", radius: 0.5, semiMajorAxis: 17, eccentricity: 0.093, tilt: 25.1, speed: 0.008, texture: "/textures/2k_mars.jpg" },
    
    // Hành tinh lùn nằm ở vành đai tiểu hành tinh giữa Sao Hỏa và Sao Mộc
    { name: "Ceres", radius: 0.25, semiMajorAxis: 21, eccentricity: 0.075, tilt: 4, speed: 0.006, texture: "/textures/2k_ceres_fictional.jpg" },
    
    { name: "Jupiter", radius: 2.2, semiMajorAxis: 28, eccentricity: 0.048, tilt: 3.1, speed: 0.004, texture: "/textures/2k_jupiter.jpg" },
    { name: "Saturn", radius: 1.8, semiMajorAxis: 38, eccentricity: 0.056, tilt: 26.7, speed: 0.002, texture: "/textures/2k_saturn.jpg" },
    { name: "Uranus", radius: 1.2, semiMajorAxis: 48, eccentricity: 0.046, tilt: 97.7, speed: 0.0015, texture: "/textures/2k_uranus.jpg" },
    { name: "Neptune", radius: 1.1, semiMajorAxis: 56, eccentricity: 0.009, tilt: 28.3, speed: 0.001, texture: "/textures/2k_neptune.jpg" },
    
    // Nhóm hành tinh lùn ở vành đai Kuiper
    { name: "Pluto", radius: 0.3, semiMajorAxis: 66, eccentricity: 0.248, tilt: 122.5, speed: 0.0008, texture: "/textures/2k_makemake_fictional.jpg" },
    { name: "Haumea", radius: 0.35, semiMajorAxis: 74, eccentricity: 0.195, tilt: 28.2, speed: 0.0007, texture: "/textures/2k_haumea_fictional.jpg" },
    { name: "Makemake", radius: 0.4, semiMajorAxis: 82, eccentricity: 0.155, tilt: 29, speed: 0.0006, texture: "/textures/2k_makemake_fictional.jpg" },
    { name: "Eris", radius: 0.45, semiMajorAxis: 90, eccentricity: 0.441, tilt: 44, speed: 0.0005, texture: "/textures/2k_eris_fictional.jpg" }
];