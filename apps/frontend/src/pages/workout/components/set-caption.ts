/** «подход 2 из 4»; сверх плана — подписано прямо, чтобы лишний подход был осознанным */
export const setCaption = (number: number, planned: number) =>
  planned <= 0 ? `подход ${number}` : number > planned ? `подход ${number} · сверх плана` : `подход ${number} из ${planned}`
