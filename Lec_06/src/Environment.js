// src/Environment.js
import * as THREE from "three";

/**
 * Hàm khởi tạo bầu trời sao.
 * Sử dụng Particle System.
 * * @param {THREE.Scene} scene - Không gian mô phỏng chính để thêm bầu trời sao vào.
 * @returns {void}
 */
export const createStarfield = (scene) => {
    const starCount = 15000; // Số lượng ngôi sao
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3); // Mỗi ngôi sao cần 3 tọa độ (x, y, z)

    // Tạo tọa độ ngẫu nhiên phân bố trên một hình cầu lớn
    for (let i = 0; i < starCount * 3; i += 3) {
        const radius = 200 + Math.random() * 300; // Khoảng cách từ tâm: 200 đến 500
        const theta = 2 * Math.PI * Math.random(); // Góc xoay ngang
        const phi = Math.acos(2 * Math.random() - 1); // Góc xoay dọc
        
        // Chuyển đổi tọa độ Cầu (Spherical) sang tọa độ Đề-các (Cartesian: x, y, z)
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);     
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta); 
        positions[i + 2] = radius * Math.cos(phi);                   
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Cấu hình vật liệu cho các điểm (Points)
    const material = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.5, 
        sizeAttenuation: true, // Kích thước sao sẽ nhỏ đi nếu nằm ở xa camera
        transparent: true, 
        opacity: 0.8 
    });
    
    scene.add(new THREE.Points(geometry, material));
};

/**
 * Hàm khởi tạo vành đai tiểu hành tinh nằm giữa Sao Hỏa và Sao Mộc.
 * KỸ THUẬT: Sử dụng THREE.InstancedMesh.
 * LÝ DO: Particle System không cho phép tạo hạt với nhiều góc cạnh (mô phỏng các tiểu hành tinh) nếu không dùng texture custom. 
 * InstancedMesh cho phép vẽ các hình khối phức tạp (Mesh) chỉ với 1 lần gọi lệnh dựng hình (1 Draw Call).
 * * @param {THREE.Scene} scene - Không gian mô phỏng chính.
 * @returns {THREE.InstancedMesh} Trả về đối tượng InstancedMesh để có thể tự xoay trong vòng lặp render.
 */
export const createAsteroidBelt = (scene) => {
    const asteroidCount = 4000; 
    // Sử dụng khối đa diện Dodecahedron với chi tiết = 0 để làm giả hình thù tảng đá lồi lõm
    const geometry = new THREE.DodecahedronGeometry(0.1, 0); 
    const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
    
    // Khởi tạo InstancedMesh với số lượng instance bằng số lượng tiểu hành tinh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, asteroidCount);
    
    // Bật bóng đổ cho tất cả các tảng đá
    instancedMesh.castShadow = true; 
    instancedMesh.receiveShadow = true;

    // Đối tượng giả (dummy) dùng để tính toán ma trận tọa độ, góc xoay, tỷ lệ trước khi áp vào InstancedMesh
    const dummy = new THREE.Object3D(); 
    for (let i = 0; i < asteroidCount; i++) {
        const distance = 22 + Math.random() * 4; // Phân bố bán kính từ 22 đến 26
        const angle = Math.random() * Math.PI * 2; // Góc rải đều 360 độ
        const yOffset = (Math.random() - 0.5) * 1.5; // Tạo độ dày lồi lõm theo trục Y cho vành đai

        // Gắn tọa độ, góc xoay ngẫu nhiên và kích thước (scale) ngẫu nhiên
        dummy.position.set(Math.cos(angle) * distance, yOffset, Math.sin(angle) * distance);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.scale.setScalar(Math.random() * 0.8 + 0.2);
        
        // Cập nhật ma trận và ghi đè vào vị trí thứ i của InstancedMesh
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(instancedMesh);
    
    return instancedMesh;
};

/**
 * Lớp MeteorSystem quản lý hiệu ứng sao băng (Shooting Stars).
 * Cơ chế: Sinh ra các vệt sáng ngẫu nhiên bay ngang qua bầu trời và tự hủy khi hoàn thành đường bay.
 */
export class MeteorSystem {
    /**
     * @param {THREE.Scene} scene - Không gian mô phỏng chính.
     */
    constructor(scene) {
        this.scene = scene;
        this.meteors = []; // Mảng lưu trữ các sao băng đang hoạt động
        // Tái sử dụng 1 Material cho mọi sao băng để tối ưu bộ nhớ
        this.material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    }

    /**
     * Hàm sinh (tạo) ra một ngôi sao băng mới.
     * Gọi ngẫu nhiên dựa trên xác suất trong vòng lặp render.
     */
    spawn() {
        // Sao băng thực chất là một đoạn thẳng (Line) dài 2 đơn vị
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 2) 
        ]);
        const line = new THREE.Line(geometry, this.material.clone()); // Clone material để làm mờ (opacity) độc lập
        
        // Đặt vị trí xuất phát ngẫu nhiên trong không gian vũ trụ
        line.position.set(
            (Math.random() - 0.5) * 200, 
            (Math.random() - 0.5) * 100, 
            (Math.random() - 0.5) * 200
        );
        
        // Xoay sao băng ngắm về một điểm ngẫu nhiên để tạo hướng bay
        line.lookAt(new THREE.Vector3(
            (Math.random() - 0.5) * 400, 
            (Math.random() - 0.5) * 200, 
            (Math.random() - 0.5) * 400
        ));
        
        this.scene.add(line);
        // Lưu trữ object, tốc độ ngẫu nhiên và vòng đời (life) khởi điểm là 1.0 (100%)
        this.meteors.push({ mesh: line, speed: 1 + Math.random() * 2, life: 1.0 });
    }

    /**
     * Cập nhật vị trí và vòng đời của toàn bộ sao băng. Gọi liên tục ở mỗi khung hình.
     * Duyệt mảng ngược (từ cuối lên đầu) để khi xóa phần tử (splice) không bị lùi index gây lỗi.
     * * @param {number} timeFactor - Hệ số thời gian (đồng bộ theo FPS và tốc độ chung).
     */
    update(timeFactor) {
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const m = this.meteors[i];
            
            // Bay về phía trước theo hướng đã lookAt (trục Z cục bộ)
            m.mesh.translateZ(m.speed * timeFactor); 
            
            // Trừ dần vòng đời (làm sao băng mờ dần)
            m.life -= 0.02 * timeFactor;
            m.mesh.material.opacity = m.life;
            
            // Nếu vòng đời kết thúc, xóa đối tượng để giải phóng bộ nhớ (Garbage Collection)
            if (m.life <= 0) {
                this.scene.remove(m.mesh);
                m.mesh.geometry.dispose(); // Nên giải phóng cả geometry để dọn RAM
                this.meteors.splice(i, 1);
            }
        }
    }
}