import ngrok from "@ngrok/ngrok";

let activeListener: ngrok.Listener | null = null;

export async function startTunnel(port: number): Promise<string> {
  const listener = await ngrok.forward({
    addr: port,
    authtoken: process.env.NGROK_AUTHTOKEN,
  });

  activeListener = listener;
  const url = listener.url();
  if (!url) throw new Error("ngrok did not return a URL");
  return url;
}

export async function stopTunnel(): Promise<void> {
  if (activeListener) {
    await activeListener.close();
    activeListener = null;
  }
}
