$(function(){
    $.getJSON('glossary.json', function(data) {
        buildGlossary(data);
        buildTagNavBar(data);
        initGlossaryFilter();
        initTopicTagFilter();
    });
});

function buildGlossary(data) {
    // Group terms by letter
    const grouped = {};
    data.forEach(item => {
        const letter = item.letter.toUpperCase();
        if (!grouped[letter]) grouped[letter] = []; 
        grouped[letter].push(item);
    });

    // Build HTML
    let html = '';
    Object.keys(grouped).sort().forEach(letter => {
        html += `<div class="glossary__results__row" data-term="${letter}">
            <h3 class="glossary__results__term mb-3">${letter}</h3>
            <div class="row">`;
        grouped[letter].forEach(item => {
            // Build tags HTML
            let tagsHtml = '';
            if (item.tags && item.tags.length) {
                tagsHtml = `<div class="topic-tags">` +
                    item.tags.map(tag => `<span class="topic-tag" data-tag="${tag}">${capitalize(tag)}</span>`).join('') +
                    `</div>`;
            }
            html += `<div class="glossary__results__item col-md-3 col-sm-6" data-item="${item.term}" data-tags="${item.tags ? item.tags.join(',') : ''}">
                <a class="card card__content" href="#">
                    <div class="card__title"><h4>${item.term}</h4>${tagsHtml}</div>
                    <p class="mb-0">${item.definition}</p>
                </a>
            </div>`;
        });
        html += `</div></div>`;
    });
    $('#glossaryResults').html(html);
}

function buildTagNavBar(data) {
    // Collect all unique tags
    const tagSet = new Set();
    data.forEach(item => {
        if (item.tags && item.tags.length) {
            item.tags.forEach(tag => tagSet.add(tag));
        }
    });
    // Build nav bar HTML
    let html = `<span class="topic-tag-nav active" data-tag="all">All</span>`;
    Array.from(tagSet).sort().forEach(tag => {
        html += `<span class="topic-tag-nav" data-tag="${tag}">${capitalize(tag)}</span>`;
    });
    $('.topic-tag-nav-bar').html(html);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Filter Glossary items
function initGlossaryFilter(){
		// Filter using search box
    $("#glossarySearchInput").bind("keyup", function(){
        var inputValue = $(this).val();

        // Hide all the results & Cards
        $(".glossary__results__row").addClass("inactive");
        $(".glossary__results__item").hide();

        $(".glossary__results__row").each(function(){
            $(".glossary__results__item").each(function(){
                var item = $(this).attr("data-item");

                if(item.toUpperCase().indexOf(inputValue.toUpperCase()) != -1){
                    $(this).parents(".glossary__results__row").removeClass("inactive");
                    $(this).show();
                }
            });
        });
    });
	
		// Filter using navigation
    $(".glossary__nav a").click(function(){
        var nav = $(this).attr("data-nav");

        // Remove & Add active class
        $(".glossary__nav__item").removeClass("active");
        $(this).parent().toggleClass("active");

        // Hide all the results
        $(".glossary__results__row").addClass("inactive");

        // Loop through the row
        $(".glossary__results__row").each(function(){
            var term = $(this).attr("data-term");

            if(nav == term){
                $(this).removeClass("inactive");
            }
        });

        // Only return false if data-toggle is glossary
        if($(this).attr("data-toggle") == "glossary"){
            return false;
        }
    });
}

function initTopicTagFilter() {
    // Nav bar tag click
    $('.topic-tag-nav-bar').on('click', '.topic-tag-nav', function() {
        var tag = $(this).data('tag');
        $('.topic-tag-nav').removeClass('active');
        $(this).addClass('active');

        if (tag === 'all') {
            $('.glossary__results__item').show();
            $('.glossary__results__row').removeClass('inactive');
        } else {
            $('.glossary__results__item').hide();
            $('.glossary__results__row').addClass('inactive');
            $('.glossary__results__item').filter(function() {
                var tags = $(this).data('tags');
                return tags && tags.toLowerCase().includes(tag.toLowerCase());
            }).each(function() {
                $(this).show();
                $(this).closest('.glossary__results__row').removeClass('inactive');
            });
        }
    });

    // Tag click inside card (optional: clicking a tag acts like clicking nav)
    $('.glossary__results').on('click', '.topic-tag', function(e) {
        var tag = $(this).data('tag');
        $('.topic-tag-nav').removeClass('active');
        $('.topic-tag-nav[data-tag="' + tag + '"]').addClass('active').trigger('click');
        e.stopPropagation();
    });
}