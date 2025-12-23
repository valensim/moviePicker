async function countdown(message, date) {
    const timeTillDate = new Date(date).getTime() - new Date().getTime();
    const days = Math.floor(timeTillDate / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeTillDate % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeTillDate % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeTillDate % (1000 * 60)) / 1000);
    const countdownMessage = `**${days}d ${hours}h ${minutes}m ${seconds}s** do 30`;
    await message.reply(countdownMessage);
    return;
}

module.exports = { countdown };