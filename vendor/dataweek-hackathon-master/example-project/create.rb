# encoding: UTF-8
# 30 Days of Automation: GoodData Ruby SDK
# Visit http://sdk.gooddata.com/gooddata-ruby/ for Tutorials, Examples, and Support.

require 'rubygems'
require 'gooddata'

AUTH_TOKEN = 'ONBDIS852d718ca'

# GoodData.logging_on

GoodData.with_connection('dan.treiman@gmail.com', 'pAic2Aph2eF2od4v') do |c|
  blueprint = GoodData::Model::ProjectBlueprint.build("em-testing") do |p|
    p.add_date_dimension('date')

    p.add_dataset('meeting') do |d|
        d.add_anchor('meetingID');
    end

    p.add_dataset('persons') do |d|
        d.add_anchor('personID');
        d.add_label('name', :reference =>  "personID");
    end

    p.add_dataset('notes') do |d|
      d.add_anchor('noteID');
      d.add_date('date', :dataset => "date")
      d.add_fact('score', :gd_data_type => "DECIMAL(1,10)")
      d.add_label('sentiment' : :gd_data_type => "string");
      d.add_reference('personID', :dataset => "persons");
      d.add_reference('personID', :dataset => "persons");
    end

    p.add_dataset('sentiments') do |d|
      d.add_anchor('noteID');
      d.add_date('date', :dataset => "date")
      d.add_fact('sentiment', :gd_data_type => "DECIMAL(1,10)")
      d.add_fact('sentiment
    end

    p.add_dataset('actions') do |d|
      d.add_anchor('noteID');
      d.add_date('date', :dataset => "date")
      d.add_fact('sentiment', :gd_data_type => "DECIMAL(1,10)")
      d.add_fact('sentiment
    end

  end

  project = GoodData::Project.create_from_blueprint(blueprint, :auth_token => AUTH_TOKEN)
  puts "Created project #{project.pid}"

  GoodData::with_project(project.pid) do |p|
    # Load data
    GoodData::Model.upload_data('/Users/dtreiman/Desktop/emotivemeeting/meetings.csv, 'notes')
    
    # create  metric

# create a metric
    metric = p.fact('fact.quotes.volume').create_metric
    metric.save
    
    report = p.create_report(title: 'Awesome_report', top: [metric], left: ['date.date.mmddyyyy'])
    report.save

  end
end
