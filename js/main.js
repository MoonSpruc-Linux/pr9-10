document.addEventListener('DOMContentLoaded', init)

function init() {
	initActiveNav()
	initMenuToggle()
	initThemeToggle()
	initBackToTop()
	initAccordion()
	initFilters()
	initModal()
	initContactForm()
	initCatalog()
}

function initActiveNav() {
	const links = document.querySelectorAll('#main-nav a')
	const path = window.location.pathname.split('/').pop()
	links.forEach(link => {
		if (link.getAttribute('href') === path) {
			link.classList.add('is-active')
		}
	})
}

function initMenuToggle() {
	const btn = document.getElementById('menu-toggle')
	const nav = document.getElementById('main-nav')
	if (!btn || !nav) return

	btn.addEventListener('click', () => {
		const expanded = btn.getAttribute('aria-expanded') === 'true'
		btn.setAttribute('aria-expanded', !expanded)
		nav.classList.toggle('menu-open')
	})

	// TODO: Автозакриття при кліку на посилання
	nav.querySelectorAll('a').forEach(link => {
		link.addEventListener('click', () => {
			nav.classList.remove('menu-open')
			btn.setAttribute('aria-expanded', false)
		})
	})
}

function initThemeToggle() {
	const themeBtn = document.getElementById('theme-toggle')
	const body = document.body
	if (!themeBtn) return

	const savedTheme = localStorage.getItem('theme')
	if (savedTheme) {
		body.classList.add(savedTheme)
	}

	themeBtn.addEventListener('click', () => {
		body.classList.toggle('theme-dark')
		const current = body.classList.contains('theme-dark')
			? 'theme-dark'
			: 'theme-light'
		localStorage.setItem('theme', current)
	})
}

function initBackToTop() {
	const btn = document.getElementById('back-to-top')
	if (!btn) return

	const footerYear = document.querySelectorAll('current-year')
	if (footerYear) {
		footerYear.textContent = new Date().getFullYear()
	}

	window.addEventListener('scroll', () => {
		btn.classList.toggle('hidden', window.scrollY < 200)
	})

	btn.addEventListener('click', () => {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	})
}

function initAccordion() {
	const accordions = document.querySelectorAll('.accordion')
	if (!accordions.length) return

	accordions.forEach(acc => {
		acc.addEventListener('click', e => {
			const content = e.currentTarget.nextElementSibling
			content.classList.toggle('active')
			e.currentTarget.classList.toggle('open')
		})
	})
}

function initFilters() {
	const filterButtons = document.querySelectorAll('[data-filter]')
	const items = document.querySelectorAll('.filter-item')
	if (!filterButtons.length || !items.length) return

	filterButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const category = btn.dataset.filter
			items.forEach(item => {
				item.style.display =
					category === 'all' || item.dataset.category === category ? '' : 'none'
			})
		})
	})
}

function initModal() {
	const modal = document.getElementById('modal')
	const openBtns = document.querySelectorAll('[data-modal-open]')
	const closeBtn = modal?.querySelector('[data-modal-close]')
	if (!modal) return

	openBtns.forEach(btn =>
		btn.addEventListener('click', () => modal.classList.add('active')),
	)
	closeBtn?.addEventListener('click', () => modal.classList.remove('active'))
	modal.addEventListener('click', e => {
		if (e.target === modal) {
			modal.classList.remove('active')
		}
	})
}

function initContactForm() {
	const form = document.getElementById('contact-form')
	if (!form) return

	const inputs = form.querySelectorAll('input, textarea')

	const savedData = JSON.parse(localStorage.getItem('contactForm') || '{}')
	inputs.forEach(input => {
		if (savedData[input.name]) input.value = savedData[input.name]
		input.addEventListener('input', () => {
			savedData[input.name] = input.value
			localStorage.setItem('contactForm', JSON.stringify(savedData))
		})
	})

	form.addEventListener('submit', e => {
		e.preventDefault()
		let valid = true
		inputs.forEach(input => {
			input.classList.remove('error')
			if (input.name === 'name' && input.value.length < 2) {
				valid = false
			}
			if (input.name === 'email' && !/\S+@\S+\.\S+/.test(input.value)) {
				valid = false
			}
			if (input.name === 'message' && !input.value.trim()) {
				valid = false
			}
			if (!valid) {
				input.classList.add('error')
			}
		})
		if (!valid) return

		const formData = new FormData(form)
		const output = document.getElementById('form-output')
		if (output) {
			output.innerHTML = ''
			formData.forEach((val, key) => {
				const p = document.createElement('p')
				p.textContent = `${key}: ${val}`
				output.appendChild(p)
			})
		}

		localStorage.removeItem('contactForm')
		form.reset()
	})
}

// Practice 9-10
let state = {
	items: [],
	filtered: [],
	search: '',
	sort: 'default',
	favorites: JSON.parse(localStorage.getItem('favorites')) || [],
}

async function initCatalog() {
	const container = document.querySelector('[data-catalog]')
	if (!container) return

	showLoading(true)

	try {
		const res = await fetch('../data/items.json')
		if (!res.ok) {
			throw new Error('Cannot load JSON')
		}

		const data = await res.json()

		state.items = data
		state.filtered = data

		render(data)
		initControls()
	} catch (err) {
		showError('Failed to load data')
	} finally {
		showLoading(false)
	}
}

function render(items) {
	const container = document.querySelector('[data-catalog]')
	container.innerHTML = ''

	if (!items.length) {
		container.innerHTML = '<p>No results</p>'
		return
	}

	items.forEach(item => {
		const div = document.createElement('div')
		div.className = 'card'

		const isFav = state.favorites.includes(item.id)

		div.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.category}</p>
      <p>${item.description}</p>
      <p>⭐ ${item.rating}</p>

      <button data-fav="${item.id}">
        ${isFav ? '❤️ Remove' : '🤍 Favorite'}
      </button>
    `

		container.appendChild(div)
	})
}

function initControls() {
	const search = document.getElementById('search')
	const sort = document.getElementById('sort')
	const categoryBtns = document.querySelectorAll('[data-category]')

	search?.addEventListener('input', e => {
		state.search = e.target.value.toLowerCase()
		apply()
	})

	sort?.addEventListener('change', e => {
		state.sort = e.target.value
		apply()
	})

	categoryBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			state.category = btn.dataset.category
			apply()
		})
	})

	document.addEventListener('click', e => {
		if (e.target.dataset.fav) {
			toggleFav(Number(e.target.dataset.fav))
		}
	})
}

function apply() {
	let result = [...state.items]

	if (state.search) {
		result = result.filter(
			i =>
				i.title.toLowerCase().includes(state.search) ||
				i.description.toLowerCase().includes(state.search),
		)
	}

	if (state.sort === 'price') {
		result.sort((a, b) => a.price - b.price)
	}

	if (state.sort === 'rating') {
		result.sort((a, b) => b.rating - a.rating)
	}

	if (state.category && state.category !== 'all') {
		result = result.filter(i => i.category === state.category)
	}

	state.filtered = result
	render(result)
}

function toggleFav(id) {
	if (state.favorites.includes(id)) {
		state.favorites = state.favorites.filter(f => f !== id)
	} else {
		state.favorites.push(id)
	}

	localStorage.setItem('favorites', JSON.stringify(state.favorites))
	render(state.filtered)
}

function showLoading(show) {
	const el = document.querySelector('[data-loading]')
	if (el) el.style.display = show ? 'block' : 'none'
}

function showError(msg) {
	const el = document.querySelector('[data-error]')
	if (el) {
		el.style.display = 'block'
		el.textContent = msg
	}
}
