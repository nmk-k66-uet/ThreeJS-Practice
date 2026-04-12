import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

const textureLoader = new THREE.TextureLoader();

/**
 * Lớp CelestialBody đại diện cho một thiên thể trong hệ mặt trời (Mặt trời, Hành tinh, Mặt trăng...).
 * Lớp này bao gồm logic về hình ảnh (Mesh), quỹ đạo (Orbit), độ nghiêng trục (Tilt) và nhãn (CSS2DObject) của thiên thể đó.
 */
export default class CelestialBody {
    /**
     * Khởi tạo một thiên thể mới.
     * * @param {Object} options - Tham số cấu hình của thiên thể.
     * @param {THREE.Scene} options.scene - Scene chính của Three.js để chứa thiên thể.
     * @param {string} options.name - Tên của thiên thể (hiển thị trên nhãn).
     * @param {number} options.radius - Bán kính của khối cầu mô phỏng thiên thể.
     * @param {number} options.semiMajorAxis - Bán trục lớn của quỹ đạo hình Elip (khoảng cách trung bình đến tâm).
     * @param {number} [options.eccentricity=0] - Độ lệch tâm của quỹ đạo Elip (0: Hình tròn, < 1: Hình Elip).
     * @param {number} [options.tilt=0] - Độ nghiêng trục quay của thiên thể (tính bằng độ).
     * @param {number} options.speed - Tốc độ di chuyển trên quỹ đạo.
     * @param {string} options.texturePath - Đường dẫn đến file ảnh texture bề mặt.
     * @param {CelestialBody} [options.parent] - Thiên thể mà nó quay quanh (VD: Mặt trăng quay quanh Trái đất). Nếu không có, mặc định quay quanh gốc tọa độ (Mặt trời).
     * @param {boolean} [options.isLightSource=false] - Xác định đây có phải nguồn sáng tự phát không (VD: Mặt trời = true để không nhận đổ bóng và phát sáng).
     */
    constructor({ scene, name, radius, semiMajorAxis, eccentricity = 0, tilt = 0, speed, texturePath, parent, isLightSource = false }) {
        // --- CÁC THUỘC TÍNH CƠ BẢN ---
        this.name = name;
        this.speed = speed;
        
        // --- QUỸ ĐẠO ELIP ---
        this.a = semiMajorAxis; // a: Bán trục lớn (Semi-major axis)
        this.e = eccentricity;  // e: Độ lệch tâm (Eccentricity)
        this.b = this.a * Math.sqrt(1 - this.e * this.e); // b: Bán trục nhỏ (Semi-minor axis) tính từ a và e
        this.c = this.a * this.e; // c: Tiêu cự (Khoảng cách từ tâm Elip đến Tiêu điểm - nơi đặt Mặt trời)
        this.currentAngle = Math.random() * Math.PI * 2; // Góc vị trí khởi tạo ngẫu nhiên trên quỹ đạo

        // --- KIẾN TRÚC SCENE GRAPH (CÂY PHÂN CẤP ĐỐI TƯỢNG) ---
        // orbitGroup: Trục đứng im, làm gốc tọa độ đặt tại tiêu điểm để tính toán vị trí theo Elip
        this.orbitGroup = new THREE.Group(); 
        // tiltGroup: Trục nằm bên trong orbitGroup, được nghiêng đi để mô phỏng độ nghiêng trục xoay
        this.tiltGroup = new THREE.Group(); 
        
        // Quan hệ Parent - Child (Mặt trăng xoay quanh Hành tinh và Hành tinh xoay quanh Mặt trời)
        if (parent) parent.mesh.add(this.orbitGroup);
        else scene.add(this.orbitGroup);

        // --- Material & Texture ---
        const texture = textureLoader.load(texturePath);
        texture.colorSpace = THREE.SRGBColorSpace;

        // Nếu là nguồn sáng (Mặt trời): Dùng MeshStandardMaterial với emissive để vật thể tự phát sáng và tương tác với hiệu ứng Bloom
        // Nếu là hành tinh thường: Dùng roughness để tạo độ nhám và nhận ánh sáng
        let material = isLightSource 
            ? new THREE.MeshStandardMaterial({ map: texture, emissive: new THREE.Color(0xffffff), emissiveMap: texture, emissiveIntensity: 2.0 })
            : new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });

        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
        
        // Cấu hình nhận/đổ bóng cho các hành tinh thông thường
        if (!isLightSource) {
            this.mesh.castShadow = true;   
            this.mesh.receiveShadow = true;
        }

        // Khởi tạo Scene Graph: Nghiêng tiltGroup -> Đưa khối cầu (mesh) vào tiltGroup -> Đưa tiltGroup vào orbitGroup
        this.tiltGroup.rotation.z = tilt * (Math.PI / 180);
        this.tiltGroup.add(this.mesh);
        this.orbitGroup.add(this.tiltGroup);

        // --- NHÃN HIỂN THỊ TÊN THIÊN THỂ (HTML UI) ---
        const div = document.createElement('div');
        div.className = 'planet-label'; div.textContent = name;
        this.label = new CSS2DObject(div);
        this.label.position.set(0, radius + 0.5, 0); // Gắn nhãn nổi lên trên bề mặt hành tinh
        this.mesh.add(this.label);

        // Nếu bán trục lớn > 0 (không phải tâm hệ mặt trời), thì vẽ đường viền quỹ đạo
        if (this.a > 0) this.createEllipticalOrbit();
    }

    /**
     * Phương thức vẽ đường viền (Line) biểu diễn quỹ đạo hình Elip của thiên thể.
     * Quỹ đạo này được tính toán sao cho tiêu điểm của Elip trùng với tâm quay.
     * * @returns {void} Không trả về giá trị, đối tượng Line được thêm trực tiếp vào orbitGroup.
     */
    createEllipticalOrbit() {
        // Khởi tạo đường cong 2D. Tâm Elip được đẩy lùi về phía sau một khoảng (-c) để Mặt trời rơi đúng vào Tiêu điểm.
        const curve = new THREE.EllipseCurve(-this.c, 0, this.a, this.b, 0, 2 * Math.PI, false, 0);
        const points = curve.getPoints(128);
        
        // Chuyển mảng điểm 2D (x, y) thành mảng điểm 3D (x, 0, z) để đặt nằm ngang
        const geometry = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, 0, p.y))
        );
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
        this.orbitGroup.add(new THREE.Line(geometry, material));
    }

    /**
     * Phương thức bổ sung vành đai cho hành tinh (như Sao Thổ, Sao Thiên Vương).
     * * @param {number} innerRadius - Bán kính tính từ tâm hành tinh tới viền trong của vòng nhẫn.
     * @param {number} outerRadius - Bán kính tính từ tâm hành tinh tới viền ngoài của vòng nhẫn.
     * @param {number|string} colorHex - Mã màu hex của vòng nhẫn (VD: 0xcca370).
     * @returns {void} Thêm trực tiếp Mesh vòng nhẫn làm đối tượng con (child) của hành tinh.
     */
    addRing(innerRadius, outerRadius, colorHex) {
        const ringMesh = new THREE.Mesh(
            new THREE.RingGeometry(innerRadius, outerRadius, 64),
            // Cần set DoubleSide để nhìn được nhẫn từ cả mặt trên và mặt dưới
            new THREE.MeshStandardMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        ringMesh.castShadow = true; 
        ringMesh.receiveShadow = true;
        ringMesh.rotation.x = Math.PI / 2; // Xoay vòng nhẫn nằm ngang 90 độ
        this.mesh.add(ringMesh); // Gắn nhẫn vào trực tiếp hành tinh để nó nghiêng theo trục hành tinh
    }

    /**
     * Phương thức được gọi trong vòng lặp hoạt họa (Animation Loop) mỗi khung hình.
     * Nó chịu trách nhiệm tính toán vị trí mới của hành tinh trên quỹ đạo và góc tự xoay của hành tinh.
     * * @param {number} timeFactor - Hệ số thời gian (Delta time * tốc độ chung) để đảm bảo chuyển động mượt mà không phụ thuộc vào FPS.
     * @returns {void}
     */
    update(timeFactor) {
        // 1. Chuyển động Tự quay quanh trục (Quay quanh ngày)
        this.mesh.rotation.y += 0.01 * timeFactor;
        
        // 2. Chuyển động trên quỹ đạo Elip (Quay quanh năm)
        if (this.a > 0) {
            this.currentAngle += this.speed * timeFactor;
            // Áp dụng phương trình tham số hình Elip
            this.tiltGroup.position.x = -this.c + this.a * Math.cos(this.currentAngle);
            this.tiltGroup.position.z = this.b * Math.sin(this.currentAngle);
        }
    }
}