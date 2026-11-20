function openLinkedAnswer() {
  const id = location.hash.slice(1)
  const answer = document.getElementById(id)
  if (answer instanceof HTMLDetailsElement) answer.open = true
}

openLinkedAnswer()
window.addEventListener('hashchange', openLinkedAnswer)
