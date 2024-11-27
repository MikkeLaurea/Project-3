$(document).ready(function () {
    const $theaterSelect = $('#theaterSelect');
    const $movieDisplay = $('#movieDisplay');
    const $movieSearch = $('#movieSearch');
    let movies = [];
    const spinner = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    // Lisää/poista korostusluokka (testataan addClass/removeClass)
    function toggleHighlight(element, add = true) {
        if (add) {
            element.addClass('highlight'); // Lisää korostus
        } else {
            element.removeClass('highlight'); // Poista korostus
        }
    }

    function fetchTheaters() {
        $theaterSelect.html('<option value="">Ladataan teattereita...</option>');
        $.ajax({
            url: 'https://www.finnkino.fi/xml/TheatreAreas/',
            method: 'GET',
            dataType: 'xml',
            success: function (data) {
                const $areas = $(data).find('TheatreArea');
                $theaterSelect.html('<option value="">Valitse teatteri</option>');
                $areas.each(function () {
                    const id = $(this).find('ID').text();
                    const name = $(this).find('Name').text();
                    $theaterSelect.append(`<option value="${id}">${name}</option>`);
                });
                // Animoidaan teatterilista näkyviin
                $theaterSelect.slideDown();
            },
            error: function () {
                $theaterSelect.html('<option value="">Virhe teattereiden latauksessa</option>');
            },
        });
    }

    function fetchMovies() {
        const theaterId = $theaterSelect.val();
        if (!theaterId) return;

        $movieDisplay.html(spinner).hide().fadeIn(); // Näytetään latausanimaatio fadeIn-tehosteella
        $.ajax({
            url: `https://www.finnkino.fi/xml/Schedule/?area=${theaterId}`,
            method: 'GET',
            dataType: 'xml',
            success: function (data) {
                movies = [];
                const $shows = $(data).find('Show');
                $shows.each(function () {
                    const title = $(this).find('Title').text();
                    const imgSrc = $(this).find('EventSmallImagePortrait').text();
                    const showTimeRaw = $(this).find('dttmShowStart').text();
                    const showTime = formatShowTime(showTimeRaw);
                    const description = $(this).find('ShortSynopsis').text() || "Kuvaus ei saatavilla.";
                    const director = "Tuntematon ohjaaja";
                    const actors = "Pääosa, Sivurooli";

                    movies.push({ title, imgSrc, showTime, description, director, actors });
                });

                displayMovies(movies);
            },
            error: function () {
                $movieDisplay.html('<p>Virhe elokuvien latauksessa. Yritä uudelleen.</p>');
            },
        });
    }

    function displayMovies(movies) {
        $movieDisplay.empty();
        if (movies.length === 0) {
            $movieDisplay.html('<p>Ei näytettäviä elokuvia.</p>').fadeIn(); // fadeIn-tehoste viestille
            return;
        }
        movies.forEach((movie, index) => {
            const movieHTML = `
                <div class="movie col-md-3">
                    <img src="${movie.imgSrc}" alt="${movie.title}">
                    <h5 class="mt-2">${movie.title}</h5>
                    <p>Esitysaika: ${movie.showTime}</p>
                    <button class="btn btn-primary btn-sm mt-2" data-index="${index}" onclick="showDetails(${index})">Lisätietoja</button>
                </div>
            `;
            $movieDisplay.append(movieHTML);
        });
        $movieDisplay.slideDown(); // Näytetään elokuvat liukumalla esiin
    }

    window.showDetails = function (index) {
        const movie = movies[index];
        const modalHTML = `
            <div class="modal fade" id="movieModal" tabindex="-1" aria-labelledby="movieModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="movieModalLabel">${movie.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Sulje"></button>
                        </div>
                        <div class="modal-body">
                            <img src="${movie.imgSrc}" alt="${movie.title}" class="img-fluid mb-3">
                            <p><strong>Esitysaika:</strong> ${movie.showTime}</p>
                            <p><strong>Ohjaaja:</strong> ${movie.director}</p>
                            <p><strong>Näyttelijät:</strong> ${movie.actors}</p>
                            <p><strong>Kuvaus:</strong> ${movie.description}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sulje</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('movieModal'));
        $('#movieModal').hide().fadeIn(); // fadeIn-tehoste modalille
        modal.show();
        $('#movieModal').on('hidden.bs.modal', function () {
            $(this).fadeOut(() => $(this).remove()); // fadeOut ennen poistoa
        });
    };

    function filterMovies() {
        const searchText = $movieSearch.val().toLowerCase();
        const filteredMovies = movies.filter(movie =>
            movie.title.toLowerCase().includes(searchText)
        );
        displayMovies(filteredMovies);

        // Korostetaan hakutermiä sisältävät tulokset
        if (searchText) {
            toggleHighlight($movieSearch, true); // Lisää korostus hakukenttään
        } else {
            toggleHighlight($movieSearch, false); // Poista korostus
        }
    }

    function formatShowTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fi-FI', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    $theaterSelect.on('change', fetchMovies);
    $movieSearch.on('input', filterMovies);

    fetchTheaters();
});
