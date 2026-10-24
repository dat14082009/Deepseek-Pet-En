using System;
using System.Diagnostics;
using System.IO;
using System.Windows;

namespace DeepSeekWhaleStandalone
{
    internal static class Program
    {
        [STAThread]
        private static int Main()
        {
            var root = AppDomain.CurrentDomain.BaseDirectory;
            var log = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "DeepSeekWhaleStandalone",
                "launcher.log"
            );
            Log(log, "launcher start");

            Process electronProcess = null;
            try
            {
                var electronPath = FindElectron(root);
                Log(log, "electron=" + (electronPath ?? "<missing>"));

                if (electronPath == null)
                {
                    MessageBox.Show(
                        "Electron runtime was not found.\nPlease make sure 'node_modules/electron' is present.",
                        "DeepSeek Chibi Overlay",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error
                    );
                    return 1;
                }

                var scriptPath = Path.Combine(root, "electron-main.cjs");
                if (!File.Exists(scriptPath))
                {
                    MessageBox.Show(
                        "Launcher script 'electron-main.cjs' not found in: " + root,
                        "DeepSeek Chibi Overlay",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error
                    );
                    return 1;
                }

                var startInfo = new ProcessStartInfo
                {
                    FileName = electronPath,
                    Arguments = "\"" + scriptPath + "\"",
                    WorkingDirectory = root,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                Log(log, "starting electron process");
                electronProcess = Process.Start(startInfo);
                electronProcess.WaitForExit();
                return electronProcess.ExitCode;
            }
            catch (Exception error)
            {
                Log(log, "error=" + error);
                MessageBox.Show(error.Message, "DeepSeek Chibi Overlay", MessageBoxButton.OK, MessageBoxImage.Error);
                return 1;
            }
            finally
            {
                try
                {
                    if (electronProcess != null && !electronProcess.HasExited)
                    {
                        electronProcess.Kill();
                    }
                }
                catch { }
            }
        }

        private static string FindElectron(string root)
        {
            var local = Path.Combine(root, "node_modules", "electron", "dist", "electron.exe");
            if (File.Exists(local)) return local;

            var path = Environment.GetEnvironmentVariable("PATH") ?? "";
            foreach (var folder in path.Split(Path.PathSeparator))
            {
                if (string.IsNullOrWhiteSpace(folder)) continue;
                var candidate = Path.Combine(folder.Trim(), "electron.exe");
                if (File.Exists(candidate)) return candidate;
            }
            return null;
        }

        private static void Log(string path, string message)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(path));
                File.AppendAllText(path, DateTime.Now.ToString("o") + " " + message + Environment.NewLine);
            }
            catch { }
        }
    }
}
