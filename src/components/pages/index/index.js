import spinSoundFile from '@sound/chicken-road-2-button-click.mp3';
import jumpSoundFile from '@sound/chicken-road-2-jump.mp3';
import cashOutSoundFile from '@sound/chicken-road-2-cahout.mp3';
import winSoundFile from '@sound/chicken-road-2-win.mp3';
import loseSoundFile from '@sound/chicken-road-2-lose.mp3';
import ConfettiAnimation from './confetti.js';

const GAME_OFFER_URL = "https://www.google.com/";

class ChickenRoadGame {
	constructor() {
		this.game = document.getElementById("game");
		this.char = document.getElementById("game-char");
		this.field = document.getElementById("game-field");
		this.sectors = document.querySelectorAll(".game__sector");
		this.spinButton = document.getElementById("go-btn");
		this.cashButton = document.getElementById("cash-btn");
		this.popup = document.getElementById("popup");
		this.controls = document.getElementById("game-controls");
		this.balance = document.getElementById("balance");
		this.confettiAnimation = null;
		this.charMultiplier = document.getElementById("char-multiplier");
		this.charMultiplierElement = document.getElementById("char-multiplier-element");
		this.effectsContainer = document.getElementById("effects");
		this.effectsImage = document.getElementById("effects-image");

		this.spinSound = new Audio(spinSoundFile);
		this.jumpSound = new Audio(jumpSoundFile);
		this.cashOutSound = new Audio(cashOutSoundFile);
		this.winSound = new Audio(winSoundFile);
		this.loseSound = new Audio(loseSoundFile);

		this.rate = this.game.dataset.rate;
		this.spins = Number(this.game.dataset.spins);
		this.crashes = this.game.dataset.crashes;
		this.multipliers = this.game.dataset.multipliers;
		this.sectorWidth = this.sectors[0].offsetWidth;
		this.charMoves = 0;
		this.currentStep = 0;
		this.firstStepIndex = 1;
		this.lastStepIndex = 7;
		this.stepTime = 700;
		this.spaceScrolled = window.innerWidth;
		this.isDesktop = window.innerWidth > 768;
		this.currentSpin = 1;
		this.failStep = null;
	}

	initGame() {
		this.showNextSector(this.currentStep);
		this.calculateFontSize(this.spinButton);
		this.calculateFontSize(this.cashButton);

		this.spinButton.addEventListener("click", () => {
			this.initSpin();
		});

		this.cashButton.addEventListener("click", () => {
			this.handleCashOut();
		});
	}

	getFailStep() {
		this.failStep = Number(this.crashes.split(",")[this.currentSpin - 1]) || null;
	}

	initSpin() {
		this.spin();
	}

	spin() {
		this.currentStep += 1;
		this.getFailStep();
		this.playSound(this.spinSound);

		if (this.isDesktop && (this.currentStep === this.firstStepIndex || this.currentStep === this.lastStepIndex || this.spaceScrolled > this.field.offsetWidth)) {
			this.charMoves += 1;
		}

		if (this.currentSpin < this.spins && this.currentStep === this.failStep) {
			this.handleFail();
		} else {
			this.playSound(this.jumpSound, 100);
			this.moveChar(this.currentStep);
			this.moveField(this.currentStep);
			this.disableControls(this.stepTime);

			setTimeout(() => {
				this.showNextSector(this.currentStep);
				this.showActiveSector(this.currentStep);
				this.showFinishedSector(this.currentStep);
				this.updateBalance(this.currentStep);
				this.updateMultiplier(this.currentStep);
			}, this.stepTime / 2);

			if (this.currentStep === this.firstStepIndex) {
				this.setControlPanelActivated();
				this.setCashOutActivated();
				setTimeout(() => {
					this.showCharMultiplier();
				}, this.stepTime);
			}

			if (this.currentStep === this.lastStepIndex) {
				this.handleWin();
			}
		}
	}

	handleWin() {
		setTimeout(() => {
			this.hideCharMultiplier();
		}, this.stepTime / 2);

		setTimeout(() => {
			this.charMoves += 1.3;
			this.moveChar(this.currentStep + 1.3);
			this.moveField(this.currentStep + 1.3);
			this.showFinishedSector(this.currentStep + 1);
			this.showEffects(1000);
			this.playSound(this.winSound, 1000);
			this.showModal();
			this.disableControls(10000);
		}, this.stepTime);
	}

	handleCashOut() {
		this.showEffects();
		this.showModal();
		this.playSound(this.cashOutSound);
		this.disableControls(10000);
	}

	handleFail() {
		this.setCashOutDisabled();
		this.disableControls(1500);
		this.moveLoseChar(this.currentStep);
		this.moveField(this.currentStep);
		this.hideCharMultiplier();
		this.playSound(this.loseSound, 500);
		this.showLoseSector(this.currentStep);
		this.showFinishedSector(this.currentStep);

		setTimeout(() => {
			this.resetGame();
		}, 1500);
	}

	resetGame() {
		this.currentSpin += 1;
		this.currentStep = 0;
		this.charMoves = 0;
		this.spaceScrolled = window.innerWidth;
		this.char.classList.remove("is--lose");

		this.sectors.forEach(t => {
			if (t) {
				t.classList.remove("is--lose");
				t.classList.remove("is--active");
				t.classList.remove("is--finished");
			}
		});

		this.char.style.transform = "translateX(0px)";
		this.field.style.transform = "translateX(0px)";
		this.updateBalance(this.currentStep);
		this.updateMultiplier(this.currentStep);
		this.showNextSector(this.currentStep);
	}

	showNextSector(t) {
		const e = this.sectors[t];
		if (e) e.classList.add("is--next");
	}

	showActiveSector(t) {
		const e = this.sectors[t - 1];
		if (e) {
			e.classList.add("is--active");
			e.classList.remove("is--next");
		}
	}

	showLoseSector(t) {
		const e = this.sectors[t - 1];
		if (e) {
			e.classList.add("is--lose");
			e.classList.remove("is--next");
		}
	}

	showFinishedSector(t) {
		const e = this.sectors[t - 2];
		if (e) {
			e.classList.add("is--finished");
			e.classList.remove("is--next");
			e.classList.remove("is--active");
		}
	}

	moveField(t) {
		const e = this.sectorWidth * (t - this.charMoves);
		this.field.style.transform = `translateX(-${e}px)`;
		this.spaceScrolled += e;
	}

	moveChar(t) {
		this.char.classList.add("is--active");

		if (t === this.firstStepIndex || t >= this.lastStepIndex || this.spaceScrolled > this.field.offsetWidth) {
			const offset = this.sectorWidth * this.charMoves;
			this.char.style.transform = `translateX(${offset}px)`;
		}

		setTimeout(() => {
			this.char.classList.remove("is--active");
		}, this.stepTime);
	}

	moveLoseChar(t) {
		this.char.classList.add("is--lose");

		if (this.isDesktop && (t === 1 || t === 7 || this.spaceScrolled > this.field.offsetWidth)) {
			const offset = this.sectorWidth * this.charMoves;
			this.char.style.transform = `translateX(${offset}px)`;
		}
	}

	updateBalance(t) {
		const e = this.multipliers.split(",");
		const s = t !== 0 ? (this.rate * e[t - 1]).toFixed(2) : "0";
		this.balance.innerText = s;
	}

	updateMultiplier(t) {
		const e = this.multipliers.split(",");
		const s = t !== 0 ? e[t - 1] : "0";
		this.charMultiplier.innerText = s;
	}

	showCharMultiplier() {
		this.charMultiplierElement.classList.add("is--active");
	}

	hideCharMultiplier() {
		this.charMultiplierElement.classList.remove("is--active");
	}

	setControlPanelActivated() {
		this.controls.classList.add("is--active");
	}

	setCashOutActivated() {
		this.controls.classList.add("is--cashout-active");
	}

	setCashOutDisabled() {
		this.controls.classList.remove("is--cashout-active");
	}

	disableControls(t) {
		this.spinButton.setAttribute("disabled", "");
		if (t) {
			setTimeout(() => {
				this.spinButton.removeAttribute("disabled");
			}, t);
		}
	}

	showEffects(t = 0, e = 1500) {
		this.effectsContainer.classList.add("visible");
		setTimeout(() => {
			const block = document.createElement("div");
			if (this.effectsImage) {
				block.style.backgroundImage = `url(${this.effectsImage.src})`;
			}
			block.classList.add("effects__block");
			this.effectsContainer.appendChild(block);
			setTimeout(() => {
				this.effectsContainer.classList.remove("visible");
				this.effectsContainer.classList.add("hidden");
			}, e);
		}, t);
	}

	showModal() {
		document.body.classList.add("is--modal-open");
		this.popup.classList.add("show");

		if (!this.confettiAnimation) {
			this.confettiAnimation = new ConfettiAnimation(this.popup);
		}
	}

	playSound(t, e = 0) {
		setTimeout(() => {
			t.muted = false;
			t.currentTime = 0;
			t.play().catch(err => {
				console.error("Audio playback error: ", err);
			});
		}, e);
	}

	calculateFontSize(t, e = { threshold: 25, step: 0.03, minPercent: 0.6 }) {
		if (!t) return;

		const spans = t.querySelectorAll("span");
		if (spans) {
			spans.forEach(span => {
				const length = String(span.innerText).length;
				const style = window.getComputedStyle(span);
				const fontSize = parseFloat(style.getPropertyValue("font-size"));
				const maxSize = fontSize;
				const minSize = fontSize * e.minPercent;
				const excess = Math.max(0, length - e.threshold);
				const newSize = Math.max(maxSize - excess * (fontSize * e.step), minSize);
				span.style.fontSize = `${newSize}px`;
			});
		}
	}
}

// Redirect handler for win CTA button
function setupRedirectHandler() {
	const button = document.getElementById('win-cta');
	if (!button) return;

	button.addEventListener('click', function (e) {
		e.preventDefault();
		e.stopPropagation();
		window.location.href = GAME_OFFER_URL;
	});
}

// Initialize game when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	new ChickenRoadGame().initGame();
	setupRedirectHandler();
});
