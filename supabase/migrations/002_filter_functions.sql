-- Filtered tools query RPC function
-- Used by Astro SSR and API endpoint for server-side filtering
create or replace function get_filtered_tools(
  p_sort text default 'featured',
  p_category text[] default null,
  p_license text[] default null,
  p_language text[] default null,
  p_hardware text[] default null,
  p_deployment text[] default null,
  p_model_format text[] default null,
  p_maturity text[] default null,
  p_last_updated text default null,
  p_limit int default 32,
  p_offset int default 0
)
returns setof tools
language plpgsql stable
as $$
begin
  return query
  select * from tools
  where (p_category is null or category && p_category)
    and (p_license is null or license = any(p_license))
    and (p_language is null or language && p_language)
    and (p_hardware is null or hardware && p_hardware)
    and (p_deployment is null or deployment && p_deployment)
    and (p_model_format is null or model_format && p_model_format)
    and (p_maturity is null or maturity = any(p_maturity))
    and (
      p_last_updated is null or
      case p_last_updated
        when '30d' then last_updated >= current_date - interval '30 days'
        when '6m' then last_updated >= current_date - interval '6 months'
        when '1y' then last_updated >= current_date - interval '1 year'
        else true
      end
    )
  order by
    case p_sort
      when 'featured' then (case when featured then 0 else 1 end)
      when 'newest' then extract(epoch from date_added) * -1
      when 'recently-updated' then extract(epoch from coalesce(last_updated, date_added)) * -1
      when 'most-popular' then (popularity_score * -1)::text
      when 'az' then name
      when 'za' then name
      else (case when featured then 0 else 1 end)
    end asc,
    case p_sort when 'za' then name end desc
  limit p_limit
  offset p_offset;
end;
$$;

-- Count function for pagination / result count display
create or replace function count_filtered_tools(
  p_sort text default 'featured',
  p_category text[] default null,
  p_license text[] default null,
  p_language text[] default null,
  p_hardware text[] default null,
  p_deployment text[] default null,
  p_model_format text[] default null,
  p_maturity text[] default null,
  p_last_updated text default null
)
returns bigint
language plpgsql stable
as $$
  select count(*)::bigint from tools
  where (p_category is null or category && p_category)
    and (p_license is null or license = any(p_license))
    and (p_language is null or language && p_language)
    and (p_hardware is null or hardware && p_hardware)
    and (p_deployment is null or deployment && p_deployment)
    and (p_model_format is null or model_format && p_model_format)
    and (p_maturity is null or maturity = any(p_maturity))
    and (
      p_last_updated is null or
      case p_last_updated
        when '30d' then last_updated >= current_date - interval '30 days'
        when '6m' then last_updated >= current_date - interval '6 months'
        when '1y' then last_updated >= current_date - interval '1 year'
        else true
      end
    );
$$;
