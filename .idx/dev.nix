{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.python311
    pkgs.python311Packages.django
    pkgs.python311Packages.psycopg2
    pkgs.python311Packages.django-cors-headers
    pkgs.python311Packages.djangorestframework
    pkgs.python311Packages.djangorestframework-simplejwt
    pkgs.python311Packages.python-dotenv
    pkgs.python311Packages.django-redis
    pkgs.python311Packages.requests
    pkgs.python311Packages.google-genai
    pkgs.python311Packages.gunicorn
    pkgs.python311Packages.dj-database-url
    pkgs.python311Packages.psycopg2-binary
  ];
  idx = {
    previews = {
      enable = true;
    };
  };
}
