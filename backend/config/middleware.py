class MediaXFrameOptionsMiddleware:
    """
    Exempts media file requests (PDF resumes, avatars, logos) from X-Frame-Options
    restriction, allowing them to be embedded in an iframe from the frontend app.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith('/media/'):
            # Tell XFrameOptionsMiddleware not to add X-Frame-Options
            response.xframe_options_exempt = True
            
            # Remove any existing X-Frame-Options header
            if 'x-frame-options' in response.headers:
                del response.headers['x-frame-options']
            if 'X-Frame-Options' in response.headers:
                del response.headers['X-Frame-Options']
                
            # Allow framing from frontend app origins
            response.headers['Content-Security-Policy'] = (
                "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000 http://localhost:3001 http://127.0.0.1:3001;"
            )
        return response
