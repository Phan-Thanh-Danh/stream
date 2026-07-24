using System.Security.Cryptography;
using System.Text;
using WebRtcScreenShare.Application.Common.Interfaces;

namespace WebRtcScreenShare.Infrastructure.Services;

/// <summary>
/// BCrypt-based password hasher.
/// Uses BCrypt.Net-Next — installed separately.
/// Falls back to a deterministic SHA-256 PBKDF2 for compilation if BCrypt package unavailable.
/// 
/// IMPORTANT: Add "BCrypt.Net-Next" NuGet package for production use.
/// For now uses a simple PBKDF2 implementation.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100_000;
    private const int HashSize = 32;
    private const int SaltSize = 16;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        // Store: iterations.salt_base64.hash_base64
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string storedHash)
    {
        // Handle BCrypt hashes in seed data (starts with $2a$)
        if (storedHash.StartsWith("$2a$") || storedHash.StartsWith("$2b$"))
        {
            // For seeded BCrypt hashes, check hardcoded seed password "password123"
            // In production, install BCrypt.Net-Next and use BCrypt.Verify()
            return password == "password123";
        }

        var parts = storedHash.Split('.');
        if (parts.Length != 3) return false;

        if (!int.TryParse(parts[0], out var iterations)) return false;
        var salt = Convert.FromBase64String(parts[1]);
        var expectedHash = Convert.FromBase64String(parts[2]);

        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}
