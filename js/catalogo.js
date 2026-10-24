(() => {
  const toggle = document.getElementById("catalogFilterToggle");
  const panel = document.getElementById("catalogFilterPanel");
  const reset = document.getElementById("catalogFilterReset");
  const count = document.getElementById("filterCount");
  const brandOptions = document.getElementById("catalogBrandOptions");
  const entityOptions = document.getElementById("catalogEntityOptions");
  const emptyState = document.getElementById("catalogEmptyState");
  const searchInput = document.getElementById("catalogSearch");
  const cards = Array.from(document.querySelectorAll(".stream-card"));
  const categoryInputs = Array.from(document.querySelectorAll('input[name="category"]'));
  const accessInputs = Array.from(document.querySelectorAll('input[name="access"]'));
  const allCategoriesInput = categoryInputs.find((input) => input.value === "all");
  const allAccessInput = accessInputs.find((input) => input.value === "all");
  const paginationRoots = document.querySelectorAll(".stream-pagination");
  const pageTrigger = document.querySelector(".stream-page-trigger");
  const pageModal = document.querySelector(".stream-page-modal");
  const pageClose = document.querySelector(".stream-page-close");
  const pageForm = document.querySelector(".stream-page-form");
  const pageInput = document.querySelector("#stream-page-input");
  const pageError = document.querySelector(".stream-page-error");
  const pageSize = 30;
  let currentPage = 1;

  if (
    !(toggle instanceof HTMLButtonElement) ||
    !(panel instanceof HTMLDivElement) ||
    !(reset instanceof HTMLButtonElement) ||
    !(count instanceof HTMLSpanElement) ||
    !(brandOptions instanceof HTMLDivElement) ||
    !(entityOptions instanceof HTMLDivElement) ||
    !(emptyState instanceof HTMLParagraphElement) ||
    !(searchInput instanceof HTMLInputElement) ||
    !allCategoriesInput ||
    !allAccessInput
  ) {
    throw new Error("No se pudo inicializar el panel de filtros del catálogo.");
  }

  const normalizeFilterValue = (value) => value.trim().toLocaleLowerCase("es");

  const brands = new Map();
  const entities = new Map();
  cards.forEach((card) => {
    const brand = card.dataset.brand?.trim();
    if (brand) {
      const value = normalizeFilterValue(brand);
      if (!brands.has(value)) brands.set(value, brand.toLocaleUpperCase("es"));
    }

    const entity = card.dataset.entity?.trim();
    if (entity) {
      const value = normalizeFilterValue(entity);
      if (!entities.has(value)) entities.set(value, entity.toLocaleUpperCase("es"));
    }
  });

  const logoOrder = Array.from(document.querySelectorAll(".spotlight-platforms img[data-brand]"))
    .map((logo) => logo.dataset.brand?.trim())
    .filter((brand) => brand && brands.has(normalizeFilterValue(brand)));
  const orderedBrands = [
    ...new Set(logoOrder.map(normalizeFilterValue)),
    ...Array.from(brands.keys()).filter((brand) => !logoOrder.some((logoBrand) => normalizeFilterValue(logoBrand) === brand)),
  ].map((brand) => ({ brand, label: brands.get(brand) }));

  const createFilterOptions = (container, options, name) => {
    options.forEach(({ value, label }) => {
      const option = document.createElement("label");
      option.className = "catalog-filter-option";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = value;

      const text = document.createElement("span");
      text.textContent = label;

      option.append(input, text);
      container.append(option);
    });
  };

  createFilterOptions(
    brandOptions,
    orderedBrands.map(({ brand, label }) => ({ value: brand, label })),
    "brand",
  );

  createFilterOptions(
    entityOptions,
    Array.from(entities, ([value, label]) => ({ value, label })),
    "entity",
  );

  const brandInputs = Array.from(brandOptions.querySelectorAll('input[name="brand"]'));
  const entityInputs = Array.from(entityOptions.querySelectorAll('input[name="entity"]'));
  const defaultEmptyMessage = emptyState.textContent ?? "";

  const normalize = (value) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

  const searchableCards = cards.map((card) => {
    const title = card.querySelector(".stream-title")?.textContent ?? "";
    return { card, words: new Set(normalize(title).split(/[^a-z0-9+]+/).filter(Boolean)) };
  });

  const matchesSearch = (words, searchTerms) => {
    for (const term of searchTerms) {
      let found = false;
      for (const word of words) {
        if (word.startsWith(term) || (term.length >= 3 && word.includes(term))) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  };

  const getPageFromUrl = () => {
    const page = Number(new URLSearchParams(window.location.search).get("stream-page"));
    return Number.isInteger(page) && page > 0 ? page : 1;
  };

  window.addEventListener("load", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });

  const updatePageUrl = (page) => {
    const url = new URL(window.location.href);
    url.searchParams.set("stream-page", String(page));
    try {
      window.history.replaceState({}, "", url);
    } catch {
      window.location.assign(url.href);
    }
  };

  const scrollToCatalogTop = () => {
    const catalogSection = document.getElementById("explorar");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = (page, total) => {
    paginationRoots.forEach((root) => {
      root.replaceChildren();

      if (total <= 1) {
        const onlyPage = document.createElement("button");
        onlyPage.type = "button";
        onlyPage.className = "stream-page-number is-active";
        onlyPage.textContent = "1";
        onlyPage.disabled = true;
        onlyPage.setAttribute("aria-current", "page");
        root.append(onlyPage);
        return;
      }

      const createPageButton = (number, isActive = false) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `stream-page-number${isActive ? " is-active" : ""}`;
        button.textContent = String(number);
        if (isActive) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => {
          currentPage = number;
          updatePageUrl(number);
          updateResults();
          scrollToCatalogTop();
        });
        return button;
      };

      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = `stream-page-direction${page === 1 ? " is-disabled" : ""}`;
      previous.textContent = "←";
      previous.disabled = page === 1;
      previous.setAttribute("aria-label", "Anterior");
      previous.addEventListener("click", () => {
        if (page === 1) return;
        currentPage = page - 1;
        updatePageUrl(currentPage);
        updateResults();
        scrollToCatalogTop();
      });
      root.append(previous);

      if (total <= 5) {
        for (let number = 1; number <= total; number += 1) {
          root.append(createPageButton(number, number === page));
        }
      } else {
        const visiblePages = [...new Set([1, page, total].filter((number) => number >= 1 && number <= total))].sort((a, b) => a - b);
        visiblePages.forEach((number, index) => {
          if (index > 0 && number - visiblePages[index - 1] > 1) {
            const dots = document.createElement("span");
            dots.className = "stream-page-dots";
            dots.textContent = "…";
            dots.setAttribute("aria-hidden", "true");
            root.append(dots);
          }
          root.append(createPageButton(number, number === page));
        });
      }

      const next = document.createElement("button");
      next.type = "button";
      next.className = `stream-page-direction${page === total ? " is-disabled" : ""}`;
      next.textContent = "→";
      next.disabled = page === total;
      next.setAttribute("aria-label", "Siguiente");
      next.addEventListener("click", () => {
        if (page === total) return;
        currentPage = page + 1;
        updatePageUrl(currentPage);
        updateResults();
        scrollToCatalogTop();
      });
      root.append(next);
    });
  };

  const openPageModal = () => {
    if (!pageModal || !pageInput) return;
    pageModal.classList.add("is-open");
    pageModal.setAttribute("aria-hidden", "false");
    pageInput.value = "";
    if (pageError) {
      pageError.textContent = "";
      pageError.classList.remove("is-visible");
    }
    pageInput.focus();
  };

  const closePageModal = () => {
    if (!pageModal) return;
    pageModal.classList.remove("is-open");
    pageModal.setAttribute("aria-hidden", "true");
    if (pageInput) pageInput.value = "";
    if (pageError) {
      pageError.textContent = "";
      pageError.classList.remove("is-visible");
    }
    pageTrigger?.focus();
  };

  const updateResults = () => {
    const selectedCategories = categoryInputs
      .filter((input) => input !== allCategoriesInput && input.checked)
      .map((input) => input.value);
    const selectedBrands = brandInputs.filter((input) => input.checked).map((input) => input.value);
    const selectedEntities = entityInputs.filter((input) => input.checked).map((input) => input.value);
    const selectedAccess = accessInputs
      .filter((input) => input !== allAccessInput && input.checked)
      .map((input) => input.value);
    const normalizedSearch = normalize(searchInput.value).trim();
    const searchTerms = normalizedSearch.split(/[^a-z0-9+]+/).filter((term) => term.length >= 2);
    const hasOnlyShortTerms = normalizedSearch.length > 0 && searchTerms.length === 0;

    allCategoriesInput.checked = selectedCategories.length === 0;
    allAccessInput.checked = selectedAccess.length === 0;

    const visibleMatches = [];
    searchableCards.forEach(({ card, words }) => {
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(card.dataset.type ?? "");
      const cardBrand = card.dataset.brand ? normalizeFilterValue(card.dataset.brand) : "";
      const cardEntity = card.dataset.entity ? normalizeFilterValue(card.dataset.entity) : "";
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(cardBrand);
      const matchesEntity = selectedEntities.length === 0 || selectedEntities.includes(cardEntity);
      const matchesAccess = selectedAccess.length === 0 || selectedAccess.includes(card.dataset.access ?? "");
      const matchesQuery = !normalizedSearch || (!hasOnlyShortTerms && matchesSearch(words, searchTerms));
      const visible = matchesCategory && matchesBrand && matchesEntity && matchesAccess && matchesQuery;
      if (visible) visibleMatches.push(card);
    });

    const totalPages = Math.max(1, Math.ceil(visibleMatches.length / pageSize));
    currentPage = Math.min(Math.max(1, getPageFromUrl()), totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    cards.forEach((card) => {
      const visibleIndex = visibleMatches.indexOf(card);
      const visible = visibleIndex !== -1 && visibleIndex >= start && visibleIndex < end;
      card.hidden = !visible;
    });

    const activeFilterCount = selectedCategories.length + selectedBrands.length + selectedEntities.length + selectedAccess.length;
    count.textContent = String(activeFilterCount);
    count.hidden = activeFilterCount === 0;
    toggle.setAttribute(
      "aria-label",
      activeFilterCount === 0 ? "Filtros" : `Filtros, ${activeFilterCount} seleccionados`,
    );
    emptyState.textContent = hasOnlyShortTerms
      ? "Escribe al menos 2 letras para buscar."
      : defaultEmptyMessage;
    emptyState.hidden = visibleMatches.length > 0;

    renderPagination(currentPage, totalPages);
    updatePageUrl(currentPage);

    if (pageInput) {
      pageInput.max = String(totalPages);
      pageInput.placeholder = `1-${totalPages}`;
    }

    pageTrigger.disabled = visibleMatches.length === 0;
  };

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    panel.hidden = isExpanded;
    toggle.setAttribute("aria-expanded", String(!isExpanded));
  });

  categoryInputs.forEach((input) => {
    input.addEventListener("change", () => {
      currentPage = 1;
      if (input === allCategoriesInput && input.checked) {
        categoryInputs.forEach((category) => {
          if (category !== allCategoriesInput) category.checked = false;
        });
      } else if (input !== allCategoriesInput && input.checked) {
        allCategoriesInput.checked = false;
      }
      updateResults();
    });
  });

  brandInputs.forEach((input) => input.addEventListener("change", () => {
    currentPage = 1;
    updateResults();
  }));

  entityInputs.forEach((input) => input.addEventListener("change", () => {
    currentPage = 1;
    updateResults();
  }));

  accessInputs.forEach((input) => input.addEventListener("change", () => {
    if (input === allAccessInput && input.checked) {
      accessInputs.forEach((access) => {
        if (access !== allAccessInput) access.checked = false;
      });
    } else if (input !== allAccessInput && input.checked) {
      allAccessInput.checked = false;
    } else if (input !== allAccessInput && !accessInputs.some((access) => access !== allAccessInput && access.checked)) {
      allAccessInput.checked = true;
    }
    currentPage = 1;
    updateResults();
  }));

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    updateResults();
  });

  reset.addEventListener("click", () => {
    currentPage = 1;
    categoryInputs.forEach((input) => {
      input.checked = input === allCategoriesInput;
    });
    accessInputs.forEach((input) => {
      input.checked = input === allAccessInput;
    });
    brandInputs.forEach((input) => {
      input.checked = false;
    });
    entityInputs.forEach((input) => {
      input.checked = false;
    });
    searchInput.value = "";
    updateResults();
  });

  if (pageTrigger) pageTrigger.addEventListener("click", openPageModal);
  if (pageClose) pageClose.addEventListener("click", closePageModal);
  if (pageModal) pageModal.addEventListener("click", (event) => {
    if (event.target === pageModal) closePageModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      closePanel();
      toggle.focus();
    }
    if (event.key === "Escape" && pageModal?.classList.contains("is-open")) {
      closePageModal();
    }
  });

  if (pageForm) {
    pageForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const targetPage = Number(pageInput?.value);
      if (!pageError) return;
      if (!Number.isInteger(targetPage) || targetPage < 1 || targetPage > Number(pageInput.max || 1)) {
        pageError.textContent = `Elige una página entre 1 y ${pageInput.max || 1}.`;
        pageError.classList.add("is-visible");
        return;
      }
      currentPage = targetPage;
      updatePageUrl(currentPage);
      updateResults();
      closePageModal();
      scrollToCatalogTop();
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !toggle.contains(event.target) && !panel.contains(event.target)) {
      closePanel();
    }
  });

  currentPage = getPageFromUrl();
  updateResults();
})();
