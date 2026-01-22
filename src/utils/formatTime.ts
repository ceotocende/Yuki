export default function formatTime(millis: number): string {

    var seconds: number = Math.floor((millis / 1000) % 60);
    var minutes: number = Math.floor((millis / (1000 * 60)) % 60);
    var hours: number = Math.floor((millis / (1000 * 60 * 60)) % 24);
    hours = hours < 10 ? 0 + hours : hours;
    minutes = minutes < 10 ? 0 + minutes : minutes;
    seconds = seconds < 10 ? 0 + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}