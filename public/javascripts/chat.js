var nickname = "Unknown";

function getParameter(property) {
    const url = new URL(window.location.href);
    const p = url.searchParams.get(property);
    return p;
}