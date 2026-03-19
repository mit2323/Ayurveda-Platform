"use client";
import { useEffect, useRef } from "react";

export default function HerbScene3D() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        let animationId: number;
        let THREE: typeof import("three");

        const init = async () => {
            THREE = await import("three");

            const mount = mountRef.current!;
            const width = mount.clientWidth;
            const height = mount.clientHeight;

            // Renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x000000, 0);
            mount.appendChild(renderer.domElement);

            // Scene + Camera
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
            camera.position.set(0, 0, 8);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.8);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffd699, 1.2);
            dirLight.position.set(5, 8, 5);
            scene.add(dirLight);

            const fillLight = new THREE.DirectionalLight(0xc8e6c0, 0.6);
            fillLight.position.set(-5, -3, 3);
            scene.add(fillLight);

            // ── Objects ──────────────────────────────────────────────────────────
            const objects: THREE.Mesh[] = [];

            // Color palette
            const colors = [
                0x6A9457, // sage green
                0x8B6914, // golden brown
                0x4E7040, // deep sage
                0xC9A882, // earth tan
                0x9A7050, // warm brown
                0xD4A843, // gold
                0x5C3F25, // dark earth
                0x8AAF78, // light sage
            ];

            // 1. Medicine bottles (capsule-like)
            for (let i = 0; i < 4; i++) {
                const group = new THREE.Group();

                // Bottle body
                const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.7, 16);
                const bodyMat = new THREE.MeshPhongMaterial({
                    color: colors[i % colors.length],
                    transparent: true,
                    opacity: 0.85,
                    shininess: 80,
                });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                group.add(body);

                // Bottle cap
                const capGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16);
                const capMat = new THREE.MeshPhongMaterial({
                    color: 0xfaf7f2,
                    shininess: 60,
                });
                const cap = new THREE.Mesh(capGeo, capMat);
                cap.position.y = 0.425;
                group.add(cap);

                // Bottle top dome
                const domeGeo = new THREE.SphereGeometry(0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
                const dome = new THREE.Mesh(domeGeo, capMat);
                dome.position.y = 0.5;
                group.add(dome);

                const angle = (i / 4) * Math.PI * 2 + 0.5;
                group.position.set(
                    Math.cos(angle) * 3.2,
                    Math.sin(angle * 0.7) * 1.2,
                    Math.sin(angle) * 1.5
                );
                group.rotation.z = (Math.random() - 0.5) * 0.4;
                group.userData = {
                    floatSpeed: 0.4 + Math.random() * 0.4,
                    floatOffset: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.005,
                    baseY: group.position.y,
                };

                scene.add(group);
                objects.push(group as unknown as THREE.Mesh);
            }

            // 2. Herb leaves (flattened ellipsoids)
            for (let i = 0; i < 5; i++) {
                const group = new THREE.Group();

                // Leaf shape
                const leafGeo = new THREE.SphereGeometry(0.35, 12, 8);
                leafGeo.scale(1, 0.3, 0.6);
                const leafMat = new THREE.MeshPhongMaterial({
                    color: colors[(i + 2) % colors.length],
                    transparent: true,
                    opacity: 0.8,
                    shininess: 40,
                    side: THREE.DoubleSide,
                });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                group.add(leaf);

                // Stem
                const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
                const stemMat = new THREE.MeshPhongMaterial({ color: 0x5C3F25 });
                const stem = new THREE.Mesh(stemGeo, stemMat);
                stem.position.y = -0.2;
                stem.rotation.z = 0.2;
                group.add(stem);

                const angle = (i / 5) * Math.PI * 2 + 1.2;
                group.position.set(
                    Math.cos(angle) * 2.8 + (Math.random() - 0.5) * 0.8,
                    Math.sin(angle * 0.5) * 1.8,
                    Math.sin(angle) * 2 + (Math.random() - 0.5) * 0.5
                );
                group.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                group.userData = {
                    floatSpeed: 0.3 + Math.random() * 0.5,
                    floatOffset: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.008,
                    baseY: group.position.y,
                };

                scene.add(group);
                objects.push(group as unknown as THREE.Mesh);
            }

            // 3. Mortar & pestle (sphere + cylinder)
            const mortarGroup = new THREE.Group();

            // Bowl
            const bowlGeo = new THREE.SphereGeometry(0.45, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.65);
            const bowlMat = new THREE.MeshPhongMaterial({
                color: 0xC9A882,
                shininess: 30,
            });
            const bowl = new THREE.Mesh(bowlGeo, bowlMat);
            mortarGroup.add(bowl);

            // Pestle
            const pestleGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.8, 12);
            const pestle = new THREE.Mesh(pestleGeo, bowlMat);
            pestle.position.set(0.2, 0.5, 0);
            pestle.rotation.z = -0.4;
            mortarGroup.add(pestle);

            mortarGroup.position.set(-3.5, 0.5, 0);
            mortarGroup.userData = {
                floatSpeed: 0.35,
                floatOffset: 1.2,
                rotSpeed: 0.003,
                baseY: 0.5,
            };
            scene.add(mortarGroup);
            objects.push(mortarGroup as unknown as THREE.Mesh);

            // 4. Small floating spheres (seeds/berries)
            for (let i = 0; i < 12; i++) {
                const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 10, 10);
                const mat = new THREE.MeshPhongMaterial({
                    color: colors[i % colors.length],
                    shininess: 100,
                });
                const sphere = new THREE.Mesh(geo, mat);
                sphere.position.set(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 3
                );
                sphere.userData = {
                    floatSpeed: 0.5 + Math.random() * 0.8,
                    floatOffset: Math.random() * Math.PI * 2,
                    rotSpeed: 0,
                    baseY: sphere.position.y,
                };
                scene.add(sphere);
                objects.push(sphere);
            }

            // 5. Crystalline powder vial
            const vialGroup = new THREE.Group();
            const vialGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.8, 20);
            const vialMat = new THREE.MeshPhongMaterial({
                color: 0x8AAF78,
                transparent: true,
                opacity: 0.7,
                shininess: 120,
            });
            const vial = new THREE.Mesh(vialGeo, vialMat);
            vialGroup.add(vial);
            const vialCapGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 20);
            const vialCap = new THREE.Mesh(vialCapGeo, new THREE.MeshPhongMaterial({ color: 0x4E7040, shininess: 80 }));
            vialCap.position.y = 0.45;
            vialGroup.add(vialCap);
            vialGroup.position.set(3.2, -0.5, 0.5);
            vialGroup.rotation.z = 0.3;
            vialGroup.userData = {
                floatSpeed: 0.55,
                floatOffset: 2.5,
                rotSpeed: 0.004,
                baseY: -0.5,
            };
            scene.add(vialGroup);
            objects.push(vialGroup as unknown as THREE.Mesh);

            // ── Animation Loop ────────────────────────────────────────────────────
            const clock = new THREE.Clock();

            const animate = () => {
                animationId = requestAnimationFrame(animate);
                const t = clock.getElapsedTime();

                objects.forEach((obj) => {
                    const { floatSpeed, floatOffset, rotSpeed, baseY } = obj.userData;
                    obj.position.y = baseY + Math.sin(t * floatSpeed + floatOffset) * 0.15;
                    obj.rotation.y += rotSpeed;
                });

                // Subtle camera drift
                camera.position.x = Math.sin(t * 0.08) * 0.3;
                camera.position.y = Math.sin(t * 0.06) * 0.15;
                camera.lookAt(0, 0, 0);

                renderer.render(scene, camera);
            };

            animate();

            // ── Resize handler ───────────────────────────────────────────────────
            const handleResize = () => {
                if (!mount) return;
                const w = mount.clientWidth;
                const h = mount.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            };
            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
                cancelAnimationFrame(animationId);
                renderer.dispose();
                if (mount.contains(renderer.domElement)) {
                    mount.removeChild(renderer.domElement);
                }
            };
        };

        const cleanup = init();
        return () => {
            cleanup.then((fn) => fn && fn());
        };
    }, []);

    return (
        <div
            ref={mountRef}
            className="w-full h-full"
            style={{ minHeight: "500px" }}
        />
    );
}