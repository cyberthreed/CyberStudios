// dream in pixels. create without limits.
type Companion = { readonly name: string; energy: number; online?: boolean };

export class Studio {
  private readonly visitors = new Map<string, Companion>();
  constructor(public readonly name = "CyberStudios") {}

  async welcome(companion: Companion): Promise<string> {
    const { name, energy } = companion;
    this.visitors.set(name, companion);
    const mood = energy > 42 ? "ready to create" : "taking a break";
    return `${name} is ${mood}. Welcome home.`;
  }
}

const byte: Companion = { name: "Byte", energy: 88, online: true };
console.log(await new Studio().welcome(byte));
