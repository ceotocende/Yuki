export default function formatTimeForProfile(millis: number): string {

    var seconds: number = Math.floor((millis / 1000) % 60);
    var minutes: number = Math.floor((millis / (1000 * 60)) % 60);
    var hours: number = Math.floor((millis / (1000 * 60 * 60)));
    var day = Math.floor((millis) / (1000 * 60 * 60 * 24))
    var mounth: number = Math.floor((millis / (1000 * 60 * 60 * 24 * 30)));

    if (mounth !== 0 && day !== 0) {
        return mounth + '/m/' + day + `/d`
    } else {
        return hours + `/h/` + minutes + `/m/` + seconds + `/s`;
    }
}