#!/usr/bin/env bun

interface NotificationOptions {
  title: string;
  message: string;
  sound?: boolean;
}

class MatchaChecker {
  private readonly url = "https://global.ippodo-tea.co.jp/collections/matcha/products/matcha173512";
  // private readonly url = "https://global.ippodo-tea.co.jp/collections/gyokuro/products/gyokuro401052";
  private readonly userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  async checkAvailability(): Promise<boolean> {
    try {
      console.log(`🔍 Checking availability at: ${this.url}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Check for "Add to cart" button
      const isAvailable = this.parseAvailability(html);

      return isAvailable;
    } catch (error) {
      console.error(`❌ Error checking availability: ${error}`);
      return false;
    }
  }

  private parseAvailability(html: string): boolean {
    // Look for various forms of "Add to cart" text
    const addToCartPatterns = [
      /<span[^>]*>Add to cart<\/span>/i,
      /<button[^>]*>Add to cart<\/button>/i,
      /<a[^>]*>Add to cart<\/a>/i,
      /<div[^>]*>Add to cart<\/div>/i,
    ];

    for (const pattern of addToCartPatterns) {
      if (pattern.test(html)) {
        return true;
      }
    }

    return false;
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    const { title, message, sound = true } = options;

    try {
      // Platform-agnostic notification using different methods
      if (process.platform === 'darwin') {
        // macOS
        await Bun.spawn(['osascript', '-e', `display notification "${message}" with title "${title}"`]);
        if (sound) {
          await Bun.spawn(['afplay', '/System/Library/Sounds/Glass.aiff']);
        }
      } else if (process.platform === 'linux') {
        // Linux - try different notification methods
        try {
          await Bun.spawn(['notify-send', title, message]);
        } catch {
          // Fallback to terminal bell
          process.stdout.write('\x07');
        }
      } else if (process.platform === 'win32') {
        // Windows
        try {
          await Bun.spawn(['powershell', '-Command', `New-BurntToastNotification -Text "${title}", "${message}"`]);
        } catch {
          // Fallback to terminal bell
          process.stdout.write('\x07');
        }
      } else {
        // Fallback for other platforms
        process.stdout.write('\x07'); // Terminal bell
      }
    } catch (error) {
      console.error(`❌ Error showing notification: ${error}`);
      // Fallback to console output
      console.log(`🔔 NOTIFICATION: ${title} - ${message}`);
    }
  }

  async run(): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`\n🕐 [${timestamp}] Starting matcha availability check...`);

    const isAvailable = await this.checkAvailability();

    if (isAvailable) {
      console.log('✅ Matcha is available!');
      await this.showNotification({
        title: '🍵 Matcha Available!',
        message: 'The matcha product is now in stock!',
        sound: true
      });
    } else {
      console.log('❌ Matcha is not available');
    }

    console.log(`🕐 [${timestamp}] Check completed.\n`);
  }
}

// Main execution
async function main() {
  const checker = new MatchaChecker();
  await checker.run();
}

// Handle command line arguments
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { MatchaChecker }; 