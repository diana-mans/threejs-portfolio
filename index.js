import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//Создание сцены
const scene = new THREE.Scene();

// Создание камеры
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.rotation.x = 6;

// Рендер
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding; // Добавьте это

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Добавьте эти ограничения после создания controls
controls.minPolarAngle = 0; // Минимальный угол (в радианах) - вид сверху
controls.maxPolarAngle = Math.PI / 2.5; // Максимальный угол - горизонтальный вид
controls.minDistance = 5; // Минимальное расстояние до цели
controls.maxDistance = 15; // Максимальное расстояние до цели
controls.enablePan = true; // Можно ли перемещать камеру
controls.enableZoom = true; // Можно ли приближать/отдалять

//Добавление освещения
const ambientLight = new THREE.AmbientLight('white', 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 1);
directionalLight.position.set(5, 5, 5);
// Для directionalLight:
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 20;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Функция для создания градиентной текстуры
function createGradientTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext('2d');

	// Создаём вертикальный градиент: голубое небо -> белый горизонт
	const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
	gradient.addColorStop(0, '#87ceeb'); // верх — голубой
	gradient.addColorStop(1, '#ffffff'); // низ — белый

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	return texture;
}

// Устанавливаем фон сцены
scene.background = createGradientTexture();

// Функция для создания текстуры асфальта с разметкой
function createRoadTexture() {
	const canvas = document.createElement('canvas');
	canvas.width = 1024;
	canvas.height = 1024; // квадрат для удобства круга
	const ctx = canvas.getContext('2d');

	// Фон — асфальт
	ctx.fillStyle = '#444';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// "Шум" для асфальта
	for (let i = 0; i < 20000; i++) {
		const x = Math.random() * canvas.width;
		const y = Math.random() * canvas.height;
		const gray = Math.floor(100 + Math.random() * 60);
		ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
		ctx.fillRect(x, y, 1, 1);
	}

	// Круговая разметка (прерывистая линия)
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	const radius = canvas.width * 0.201; // радиус круга (подберите под вашу сцену)
	ctx.save();
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 4;
	// ctx.setLineDash([40, 30]); // прерывистая линия
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
	ctx.stroke();
	ctx.beginPath();

	ctx.arc(centerX, centerY, radius + 100, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();

	const texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1, 1);
	return texture;
}

// ...создание road оставьте как есть...
const road = new THREE.Mesh(
	new THREE.PlaneGeometry(20, 20), // квадратная плоскость
	new THREE.MeshStandardMaterial({
		map: createRoadTexture(),
		roughness: 0.8,
		metalness: 0.2,
	}),
);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

//Добавляем траву
const grassTexture = new THREE.TextureLoader().load('images/grass.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(2, 2); // можно изменить для плотности текстуры

// Создание круга травы в центре
const grassGeometry = new THREE.CircleGeometry(4, 32); // радиус 10, 64 сегмента для плавности
const grassMaterial = new THREE.MeshStandardMaterial({
	map: grassTexture,
	roughness: 1,
	metalness: 0.1,
});
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.position.set(0, 0.01, 0); // чуть выше дороги, чтобы не было мерцания
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

// Добавим много 3D-моделей травы внутри большого круга травы
const grassModelsCount = 10; // количество кустиков травы
const grassModelsRadius = 2; // чуть меньше радиуса круга, чтобы не выходили за край
const grassModelsYOffset = 0; // чуть выше земли

const grassModelLoader = new GLTFLoader();
for (let i = 0; i < grassModelsCount; i++) {
	const angle = Math.random() * Math.PI * 2;
	const r = Math.random() * grassModelsRadius;
	const x = Math.cos(angle) * r;
	const z = Math.sin(angle) * r;

	grassModelLoader.load(
		'./models/grass/scene.gltf',
		function (gltf) {
			const grassModel = gltf.scene;
			const scale = 0.7 + Math.random() * 0.2; // случайный размер
			grassModel.scale.set(scale, scale, scale);
			grassModel.position.set(x, grassModelsYOffset, z);
			grassModel.rotation.y = Math.random() * Math.PI * 2; // случайный поворот
			grassModel.traverse((obj) => {
				// if (obj.isMesh) obj.castShadow = true;
			});
			scene.add(grassModel);
		},
		undefined,
		function (error) {
			console.error('Ошибка загрузки 3D травы:', error);
		},
	);
}

const treeModelLoader = new GLTFLoader();
treeModelLoader.load(
	'./models/elm_tree/scene.gltf',
	function (gltf) {
		const treeModel = gltf.scene;
		const scale = 0.15; // случайный размер
		treeModel.scale.set(scale, scale, scale);
		treeModel.position.set(0, 0, 0);
		treeModel.rotation.y = Math.random() * Math.PI * 2; // случайный поворот
		treeModel.traverse((obj) => {
			if (obj.isMesh) obj.castShadow = true;
		});
		scene.add(treeModel);
	},
	undefined,
	function (error) {
		console.error('Ошибка загрузки 3D дерева:', error);
	},
);

//Загрузка 3D модели

const loader = new GLTFLoader();
let car = undefined;

function addCarHeadlights(car) {
	// Параметры фар
	const headlightDistance = 8;
	const headlightAngle = Math.PI / 8;
	const headlightColor = 0xffffff;

	// Левая фара
	const leftLight = new THREE.SpotLight(
		headlightColor,
		2,
		headlightDistance,
		headlightAngle,
		0.5,
		1,
	);
	leftLight.position.set(0.3, 0.5, 2); // смещение относительно центра машины (подберите под вашу модель)
	leftLight.target.position.set(0.3, 0.1, 4); // направление света
	car.add(leftLight);
	car.add(leftLight.target);

	// Правая фара
	const rightLight = new THREE.SpotLight(
		headlightColor,
		2,
		headlightDistance,
		headlightAngle,
		0.5,
		1,
	);
	rightLight.position.set(-0.3, 0.5, 2);
	rightLight.target.position.set(-0.3, 0.1, 4);
	car.add(rightLight);
	car.add(rightLight.target);

	// Светящиеся круги на фарах
	const circleGeometry = new THREE.CircleGeometry(0.08, 18); // радиус подберите под модель
	const circleMaterial = new THREE.MeshBasicMaterial({
		color: 'fff',
		transparent: true,
		opacity: 0.8,
		emissive: 0xffffcc, // для эффекта свечения
		emissiveIntensity: 1,
		depthWrite: false,
	});

	const left1Circle = new THREE.Mesh(circleGeometry, circleMaterial);
	left1Circle.position.set(0.4, 0.58, 1.95); // чуть впереди фары
	left1Circle.rotation.x = 0;
	car.add(left1Circle);

	const left2Circle = new THREE.Mesh(circleGeometry, circleMaterial);
	left2Circle.position.set(0.55, 0.58, 1.93); // чуть впереди фары
	left2Circle.rotation.x = 0;
	car.add(left2Circle);

	const right1Circle = new THREE.Mesh(circleGeometry, circleMaterial.clone());
	right1Circle.position.set(-0.4, 0.58, 1.95);
	right1Circle.rotation.x = 0;
	car.add(right1Circle);

	const right2Circle = new THREE.Mesh(circleGeometry, circleMaterial);
	right2Circle.position.set(-0.55, 0.58, 1.93); // чуть впереди фары
	right2Circle.rotation.x = 0;
	car.add(right2Circle);
}

loader.load(
	'./models/bmw/scene.gltf',
	function (gltf) {
		car = gltf.scene;
		car.scale.set(0.5, 0.5, 0.5);
		car.position.y = 0;
		car.position.x = 5 * Math.cos(0);
		car.position.z = 5 * Math.sin(0);
		car.rotation.y = -0;
		car.traverse((obj) => {
			if (obj.isMesh) obj.castShadow = true;
		});
		addCarHeadlights(car); // <-- добавьте эту строку

		scene.add(car);
	},
	(xhr) => {
		console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	function (error) {
		console.error(error);
	},
);

const parkingSigns = [];
const parkingCount = 4;
const parkingRadius = 4; // тот же радиус, что и у машинки
const parkingYOffset = 0; // высота установки знака

const parkingLoader = new GLTFLoader();
for (let i = 0; i < parkingCount; i++) {
	const angle = (i / parkingCount) * Math.PI * 2;
	const x = parkingRadius * Math.cos(angle);
	const z = parkingRadius * Math.sin(angle);

	parkingLoader.load(
		'./models/parking/scene.gltf', // путь к вашей 3D-модели знака
		function (gltf) {
			const sign = gltf.scene;
			sign.scale.set(0.02, 0.02, 0.02); // подберите размер под вашу сцену
			sign.position.set(x, parkingYOffset, z);
			sign.rotation.y = -angle + Math.PI; // повернуть знак к центру
			sign.traverse((obj) => {
				if (obj.isMesh) obj.castShadow = true;
			});
			scene.add(sign);
			parkingSigns.push(sign);
		},
		undefined,
		function (error) {
			console.error('Ошибка загрузки знака Parking:', error);
		},
	);
}

const infoPoints = [
	{
		position: new THREE.Vector3(5, 0, 0),
		message: `👩‍💻 Frontend Developer (Middle)
Опыт работы: 1,5 года

Я — фронтенд-разработчик с опытом создания современных веб-приложений
 и интерактивных интерфейсов.

🔧 ТЕХНОЛОГИЧЕСКИЙ СТЕК:
• JavaScript, TypeScript, HTML5, CSS3
• React, Redux (Toolkit), React Router
• Bootstrap, Material UI
• REST API, Fetch, Axios, Express
• CSS-анимации, Matter.js, React-Spring
• HTML5 Canvas, Phaser 3, ThreeJS
• Jest, React Testing Library
• Webpack, Git, GitHub, GitLab`,
	},
	{
		position: new THREE.Vector3(-5, 0, 0),
		message: `🚀 КЛЮЧЕВЫЕ ПРОЕКТЫ:

✅ Интернет-магазин пицц – SPA с корзиной и API
✅ Лендинги для СберБизнеса и Дзена
✅ Игры и интерактивные приложения:

🎮 <a href="https://t.me/REEELClub_bot" target="_blank">Reeel</a> – игра в Telegram с лидербордом
🫧 <a href="https://diana-mans.github.io/bubbles/" target="_blank">Bubbles</a> – игра на Canvas
🐦 <a href="https://t.me/playdeckbot?start=NjX31" target="_blank">Flappy Bird-like</a> – клон популярной игры
👹 <a href="https://diana-mans.github.io/monster-tamer/" target="_blank">Monster Tamer</a> – игра на Phaser 3

🔒 Более 30 проектов под NDA`,
	},
	{
		position: new THREE.Vector3(0, 0, 5),
		message: `💡 SOFT SKILLS:

• Командная работа – легко встраиваюсь в процессы
• Быстрое обучение – осваиваю новые технологии
• Самоорганизация – соблюдаю дедлайны
• Ответственность – готова к сложным задачам

Готова приносить пользу проектам уровня Middle и выше, 
расти профессионально в сильной команде.`,
	},
	{
		position: new THREE.Vector3(0, 0, -5),
		message: `📞 КОНТАКТЫ:

Telegram: @dianochka_mans
GitHub: github.com/diana-mans

🎯 Готова к интересным проектам!
💼 Рассматриваю предложения о работе
🚀 Стремлюсь к профессиональному росту

Давайте создавать крутые проекты вместе!`,
	},
];

// function showInfo(message) {
// 	const infoBox = document.getElementById('info-block');
// 	infoBox.innerText = message;
// 	infoBox.style.display = 'block';
// }

let isChangingText = false;
let prevMessage = '';

function showInfo(message) {
	const infoBox = document.getElementById('info-block');

	if (!isChangingText) {
		infoBox.style.opacity = '0';
		infoBox.style.transform = 'translateY(-20px)';
		isChangingText = true;

		setTimeout(() => {
			// Устанавливаем новый контент
			infoBox.innerHTML = message.replace(/\n/g, '<br>');
			infoBox.dataset.currentMessage = message;

			// Плавно показываем с новым содержимым
			setTimeout(() => {
				infoBox.style.opacity = '1';
				infoBox.style.transform = 'translateY(0)';
				prevMessage = message;
				isChangingText = false;
			}, 10);
		}, 300);
	}
}

function checkInfoPoints() {
	if (!car) return;
	infoPoints.forEach((point) => {
		const distance = car.position.distanceTo(point.position);
		if (distance < 1 && prevMessage !== point.message) {
			showInfo(point.message);
		}
	});
}

let angle = 0;
let isMoving = false;

function moveCar() {
	if (!car || !isMoving) return;
	angle += 0.01;
	car.position.x = 5 * Math.cos(angle);
	car.position.z = 5 * Math.sin(angle);
	car.rotation.y = -angle;
	checkInfoPoints();
}

window.addEventListener('keydown', (event) => {
	if (event.code === 'Space') {
		isMoving = !isMoving;
	}
});

function animate() {
	requestAnimationFrame(animate);
	moveCar();
	controls.update();

	renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
