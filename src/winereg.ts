/**
 * Wine registry (.reg) file parser
 * Parses Windows registry format files used by Wine
 */

export type RegistryValue =
  & {
    name: string;
  }
  & ({
    type: "REG_SZ" | "REG_MULTI_SZ" | "REG_EXPAND_SZ";
    data: string;
  } | {
    type: "REG_DWORD" | "REG_QWORD";
    data: number;
  } | {
    type: "REG_BINARY";
    data: Uint8Array;
  });
export interface RegistryKey {
  path: string;
  values: Map<string, RegistryValue>;
  subkeys: Map<string, RegistryKey>;
}

export interface RegistryRoot {
  keys: Map<string, RegistryKey>;
}

/**
 * Parse a Windows registry (.reg) file content
 */
export function parseRegistryFile(content: string): RegistryRoot {
  const lines = content.split(/\r?\n/);
  const root: RegistryRoot = { keys: new Map() };

  let currentKey: RegistryKey | null = null;
  let currentKeyPath = "";

  const keyRegex = /^\[([^\]]+)\]/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(";") || line.startsWith("#")) {
      continue;
    }

    // Skip version header
    if (
      line.startsWith("Windows Registry Editor") ||
      line.startsWith("REGEDIT4") || line.startsWith("WINE REGISTRY")
    ) {
      continue;
    }

    // Parse registry key path [HKEY_...] 12345
    const m = keyRegex.exec(line);
    if (m) {
      currentKeyPath = m[1];
      currentKey = getOrCreateKey(root, currentKeyPath);
      continue;
    }

    // Parse registry value
    if (currentKey && line.includes("=")) {
      const value = parseRegistryValue(line);
      if (value) {
        currentKey.values.set(value.name, value);
      }
    }
  }

  return root;
}

/**
 * Get or create a registry key by path
 */
function getOrCreateKey(root: RegistryRoot, keyPath: string): RegistryKey {
  const parts = keyPath.split("\\\\");
  const rootKeyName = parts[0];

  const currentMap = root.keys;
  let currentKey = currentMap.get(rootKeyName);

  if (!currentKey) {
    currentKey = { path: rootKeyName, values: new Map(), subkeys: new Map() };
    currentMap.set(rootKeyName, currentKey);
  }

  // Navigate through subkeys
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    let subkey: RegistryKey | undefined = currentKey.subkeys.get(part);

    if (!subkey) {
      const subkeyPath = parts.slice(0, i + 1).join("\\");
      subkey = { path: subkeyPath, values: new Map(), subkeys: new Map() };
      currentKey.subkeys.set(part, subkey);
    }

    currentKey = subkey;
  }

  return currentKey;
}

/**
 * Parse a registry value line
 */
function parseRegistryValue(line: string): RegistryValue | null {
  const equalIndex = line.indexOf("=");
  if (equalIndex === -1) return null;

  const name = line.slice(0, equalIndex).trim();
  const valueText = line.slice(equalIndex + 1).trim();

  // Remove quotes from value name
  const valueName = name.startsWith('"') && name.endsWith('"')
    ? name.slice(1, -1)
    : name;

  // Parse default value (empty name)
  if (valueName === "@") {
    if (valueText.startsWith('"') && valueText.endsWith('"')) {
      return {
        name: "",
        type: "REG_SZ",
        data: unescapeString(valueText.slice(1, -1)),
      };
    }
  }

  // Parse typed values
  if (valueText.startsWith("dword:")) {
    const hexValue = valueText.slice(6);
    return {
      name: valueName,
      type: "REG_DWORD",
      data: parseInt(hexValue, 16),
    };
  }

  if (valueText.startsWith("qword:")) {
    const hexValue = valueText.slice(6);
    return {
      name: valueName,
      type: "REG_QWORD",
      data: parseInt(hexValue, 16),
    };
  }

  if (valueText.startsWith("hex:")) {
    const hexData = valueText.slice(4).replace(/,/g, "").replace(/\s/g, "");
    const bytes = new Uint8Array(hexData.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexData.slice(i * 2, i * 2 + 2), 16);
    }
    return {
      name: valueName,
      type: "REG_BINARY",
      data: bytes,
    };
  }

  if (valueText.startsWith("hex(2):")) {
    // REG_EXPAND_SZ
    const hexData = valueText.slice(7).replace(/,/g, "").replace(/\s/g, "");
    const text = hexToString(hexData);
    return {
      name: valueName,
      type: "REG_EXPAND_SZ",
      data: text,
    };
  }

  if (valueText.startsWith("hex(7):")) {
    // REG_MULTI_SZ
    const hexData = valueText.slice(7).replace(/,/g, "").replace(/\s/g, "");
    const text = hexToString(hexData);
    return {
      name: valueName,
      type: "REG_MULTI_SZ",
      data: text,
    };
  }

  // Default to string value
  if (valueText.startsWith('"') && valueText.endsWith('"')) {
    return {
      name: valueName,
      type: "REG_SZ",
      data: unescapeString(valueText.slice(1, -1)),
    };
  }

  return {
    name: valueName,
    type: "REG_SZ",
    data: valueText,
  };
}

/**
 * Convert hex string to UTF-16LE string
 */
function hexToString(hexData: string): string {
  const bytes = new Uint8Array(hexData.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexData.slice(i * 2, i * 2 + 2), 16);
  }

  // Decode as UTF-16LE, remove null terminators
  const decoder = new TextDecoder("utf-16le");
  return decoder.decode(bytes).replace(/\0/g, "");
}

/**
 * Unescape registry string value
 */
function unescapeString(str: string): string {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

/**
 * Find a registry key by path
 */
export function findKey(
  root: RegistryRoot,
  keyPath: string,
): RegistryKey | null {
  const parts = keyPath.split("\\");
  const rootKeyName = parts[0];

  let currentKey = root.keys.get(rootKeyName);
  if (!currentKey) return null;

  for (let i = 1; i < parts.length; i++) {
    currentKey = currentKey.subkeys.get(parts[i]);
    if (!currentKey) return null;
  }

  return currentKey;
}

/**
 * Find a registry value by key path and value name
 */
export function findValue(
  root: RegistryRoot,
  keyPath: string,
  valueName: string,
): RegistryValue | null {
  const key = findKey(root, keyPath);
  if (!key) return null;

  return key.values.get(valueName) || null;
}

/**
 * Get all subkeys of a registry key
 */
export function getSubkeys(key: RegistryKey): RegistryKey[] {
  return Array.from(key.subkeys.values());
}

/**
 * Get all values of a registry key
 */
export function getValues(key: RegistryKey): RegistryValue[] {
  return Array.from(key.values.values());
}

/**
 * Read and parse a registry file
 */
export async function readRegistryFile(
  filePath: string,
): Promise<RegistryRoot> {
  const content = await Deno.readTextFile(filePath);
  return parseRegistryFile(content);
}
