# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY WebRtcScreenShare.slnx ./
COPY src/WebRtcScreenShare.Api/WebRtcScreenShare.Api.csproj src/WebRtcScreenShare.Api/
COPY src/WebRtcScreenShare.Application/WebRtcScreenShare.Application.csproj src/WebRtcScreenShare.Application/
COPY src/WebRtcScreenShare.Domain/WebRtcScreenShare.Domain.csproj src/WebRtcScreenShare.Domain/
COPY src/WebRtcScreenShare.Infrastructure/WebRtcScreenShare.Infrastructure.csproj src/WebRtcScreenShare.Infrastructure/

RUN dotnet restore "src/WebRtcScreenShare.Api/WebRtcScreenShare.Api.csproj"

# Copy all source and publish
COPY . .
RUN dotnet publish "src/WebRtcScreenShare.Api/WebRtcScreenShare.Api.csproj" \
    -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY --from=build /app/publish .

EXPOSE 5000
ENTRYPOINT ["dotnet", "WebRtcScreenShare.Api.dll"]
