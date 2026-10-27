from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard production-grade pagination for Jagir AI platform.

    Specifications:
    - Default page size: 10
    - Optional page_size query parameter (e.g. ?page_size=20)
    - Fallback support for ?limit=N
    - Enforced maximum page size: 100
    - Consistent response schema:
      {
          "count": 47,
          "next": "http://.../?page=2",
          "previous": null,
          "results": [...]
      }
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

    def get_page_size(self, request):
        if self.page_size_query_param:
            try:
                # Support ?page_size=N with fallback to ?limit=N
                val = request.query_params.get(self.page_size_query_param)
                if val is None and 'limit' in request.query_params:
                    val = request.query_params.get('limit')
                if val is not None:
                    parsed = int(val)
                    if parsed > 0:
                        return min(parsed, self.max_page_size)
            except (TypeError, ValueError):
                pass
        return self.page_size

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })
